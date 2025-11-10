<img src="extension/src/assets/img/kool-cat.png" width="64"/>


https://github.com/user-attachments/assets/42c6e736-1a9e-468a-b435-17dc903efa9f


https://github.com/user-attachments/assets/f511f1a6-0553-43fb-a78c-66f00c39f6d8

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

#### As a popup
`cmd+shift+y` to open the popup.

Note that you will have to reinitialise it if you navigate away from your current page. 

#### From the devtools panel
`cmd+shift+c` to open the devtools then navigate to the `QAtomator` panel.
