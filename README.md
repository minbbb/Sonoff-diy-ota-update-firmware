# Sonoff-diy-ota-update-firmware
A simple script for updating sonoff wi-fi modules with DIY mode via OTA. [SONOFF DIY MODE Protocol v2.0](https://github.com/itead/Sonoff_Devices_DIY_Tools/blob/master/SONOFF%20DIY%20MODE%20Protocol%20Doc%20v2.0%20Doc.pdf "SONOFF DIY MODE Protocol v2.0") is used to interact with the module. 
You need nodejs to work. The script uses only standard nodejs packages, so you don't need to install any third-party packages.
### How it works
- First, the sonoff module must be connected to your network and its ip address must be determined.
- In the config.json file, you must specify the ip address of the device and the ip of your computer.
- In the directory with this script, put the firmware you want to upload.
- Rename the firmware file to firmware.bin, or specify the file name in config.json
- Run the script with the command `node update.js`
- Wait for firmware download
- You are awesome