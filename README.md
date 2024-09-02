<img src="extension/src/assets/img/kool-cat.png" width="64"/>

### Quickstart
1. `nvm use`
2. `yarn` to install the dependencies
3. `yarn start` to build and run QAtomator in the background
4. `yarn stop` to kill the webserver running in the background
----

### Running in CircleCI
Commit to your branch with a message "qatomate" to trigger the CircleCI pipeline.

### Running in your browser

Load your extension on Chrome by doing the following:
   1. Navigate to `chrome://extensions/`
   2. Toggle `Developer mode`
   3. Click on `Load unpacked extension`
   4. Load the `build` folder in `extensions/build`

Then run your extension as you would any other extensions. 

### Running via VSCode debugger
- Click on the `Run and Debug` icon on the left sidebar
- From the dropdown, select `Launch qatomate`
- Click on the green play button to run the debugger
- Note: This uses the settings in `.vscode/launch.json` to run the debugger.

### Running via command line
- Inspect mode used for debugging
  - `yarn node --inspect -r ts-node/register automator/qatomate.ts`
  - This uses the file `.vscode/launch.json` to run the debugger.
- Normal mode
  - `yarn ts-node automator/qatomate.ts`

#### As a popup
`cmd+shift+y` to open the popup.

Note that you will have to reinitialise it if you navigate away from your current page. 

#### From the devtools panel
`cmd+shift+c` to open the devtools then navigate to the `QAtomator` panel.
