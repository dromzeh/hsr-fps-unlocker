const Registry = require('winreg');
const readline = require('readline');

// checking if the HSR regkey exists
const regKey = new Registry({
  hive: Registry.HKCU,
  key: '\\Software\\Cognosphere\\Star Rail'
});

regKey.keyExists((err, exists) => {
  if (err) {
    console.log(err);
    // exit
  } else {
    if (exists) {
      console.log('Found HSR regkey, checking for GraphicsSetting_Model subkey...');

      // checking if the GraphicsSetting_Model subkey exists
      regKey.values((err, items) => {
        if (err) {
          console.log(err);
        } else {
          const value = items.find(item => item.type === 'REG_BINARY' && item.name.includes('GraphicsSettings_Model_h'));
          if (value) {
            // Found the binary value, now we can start parsing the data
            console.log(`Found Graphics Settings Binary value with name '${value.name}'\n`);

            // Convert the hex data to a string
            const hexData = value.value.toString('hex');
            const buffer = Buffer.from(hexData, 'hex');
            const dataString = buffer.toString();
            //console.log(`The data in the value is: ${dataString}`);

            // Clean the data string to remove all non-printable characters, then parse it to JSON
            const printableAscii = /[\x20-\x7E]+/g;
            const cleanDataString = dataString.match(printableAscii).join('');
            const graphicsSettings = JSON.parse(cleanDataString);

            // Print the current FPS settings
            console.log(`Current FPS: ${graphicsSettings.FPS}`);

            // Ask the user for the desired FPS settings
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout
            });

            rl.question('Enter the desired FPS: ', (FPS) => {
              graphicsSettings.FPS = parseInt(FPS);

              console.log(`\nThe modified graphics settings are: ${JSON.stringify(graphicsSettings)}\n`);

              // Converts the modified object back to hex
              const modifiedDataString = JSON.stringify(graphicsSettings);
              const modifiedBuffer = Buffer.from(modifiedDataString);
              const modifiedHexData = modifiedBuffer.toString('hex');

              // Updating the binary value with the new hex data
              regKey.set(value.name, Registry.REG_BINARY, modifiedHexData, (err) => {
                if (err) {
                  console.log(err);
                  // exit
                } else {
                  console.log(`Updated value ${value.name} to ${modifiedHexData}\n`);
                  // exit
                }
              });

              rl.close();
            });
          } else {
            console.log('Did not find value\n');
            // exit
          }
        }
      });
    } else {
      console.log('HSR regkey does not exist!\n');
      // exit
    }
  }
});