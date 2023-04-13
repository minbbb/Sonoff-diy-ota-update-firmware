"use strict";

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));

if (!fs.existsSync(config.filename)) {
	console.log("Firmware file doesn't exist")
	return;
}

unlockOTA()
	.then(startServer)
	.then(uploadFirmware)
	.catch(console.log);

function unlockOTA() {
	return new Promise((resolve, reject) => {
		console.log("Unlock OTA");
		const postData = JSON.stringify({
			data: {}
		});
		const options = {
			hostname: config.deviceIp,
			port: config.devicePort,
			path: "/zeroconf/ota_unlock",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Content-Length": Buffer.byteLength(postData)
			},
		};
		const req = http.request(options, (res) => {
			console.log(`Status: ${res.statusCode}`);
			res.on("data", (chunk) => {
				console.log(`Response: ${chunk}`);
			});
			res.on("end", () => {
				resolve();
			});
		});
		req.on("error", (error) => {
			reject(error);
		});
		req.write(postData);
		req.end();
	})
}

function uploadFirmware() {
	return new Promise((resolve, reject) => {
		(async () => {
			console.log("Upload firmware");
			const postData = JSON.stringify({
				data: {
					downloadUrl: `http://${config.computerIp}:${config.serverPort}/`,
					sha256sum: await sha256(config.filename)
				}
			});
			const options = {
				hostname: config.deviceIp,
				port: config.devicePort,
				path: "/zeroconf/ota_flash",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Length": Buffer.byteLength(postData)
				},
			};
			const req = http.request(options, (res) => {
				console.log(`Status: ${res.statusCode}`);
				res.on("data", (chunk) => {
					console.log(`Response: ${chunk}`);
				});
				res.on("end", () => {
					resolve();
				});
			});
			req.on("error", (error) => {
				reject(error);
			});
			req.write(postData);
			req.end();
		})();
	});
}

async function sha256(path) {
	const hash = crypto.createHash("sha256");
	const input = fs.createReadStream(path);
	for await (const chunk of input) {
		hash.update(chunk);
	}
	return hash.digest("hex");
}

function startServer() {
	return new Promise((resolve) => {
		let progress = 0;
		const server = http.createServer((req, res) => {
			const stat = fs.statSync(config.filename);
			const fileSize = stat.size;
			const range = req.headers.range;
			if (range) {
				const parts = range.replace(/bytes=/, "").split("-");
				const start = parseInt(parts[0], 10);
				const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
				const chunksize = (end - start) + 1;
				const file = fs.createReadStream(config.filename, { start, end });
				const head = {
					"Content-Range": `bytes ${start}-${end}/${fileSize}`,
					"Accept-Ranges": "bytes",
					"Content-Length": chunksize,
					"Content-Disposition": "attachment; filename=firmware.bin",
					"Access-Control-Allow-Origin": "*"
				};
				res.writeHead(206, head);
				file.pipe(res);
				if (start === 0) {
					progress = 0;
				}
				file.on("data", (chunk) => {
					progress += chunk.length;
					const percent = Math.floor(100 * progress / fileSize)
					console.log(`Progress: ${percent}%`);
					if (percent === 100) {
						console.log("Done");
					}
				});
			} else {
				const head = {
					"Content-Length": fileSize,
					"Content-Disposition": "attachment; filename=firmware.bin",
					"Access-Control-Allow-Origin": "*"
				};
				res.writeHead(200, head);
				fs.createReadStream(config.filename).pipe(res);
			}
		});

		server.listen(config.serverPort, () => {
			console.log(`Server running at http://${config.computerIp}:${config.serverPort}/`);
			resolve();
		});
	});
}
