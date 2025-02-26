Yarn ball! - https://yarn-ball.io/
===

_"A cute 3d puzzle platformer made with Babylon.js!"_



Build instructions
---

**Download requirements:**

Any code editor, although I prefer using [Webstorm](https://www.jetbrains.com/webstorm/download/#section=windows)

[NodeJS](https://nodejs.org/en/download) (for project dependencies)

[Github Desktop](https://desktop.github.com/download/) (optional)

**Step 1:**

- Use Github Desktop & clone the repository wherever you'd like (Clone URL: `https://github.com/izzydesigns/Yarnball-Demo.git`)

OR

- Download the repository via the "Download ZIP" button & decompress the project files wherever you'd like.

**Step 2:**

- Open your desired IDE and open the project folder as a new project

**Step 3:**

- Install  (Or skip this step if you already have it)

**Step 4:**

- Open the console in your project folder and run `npm install` to install the project's node dependencies

**Step 5:**

- Run `npm start` to serve the `index.html` file locally! (useful for testing on various devices)
- After running `npm start`, visit http://127.0.0.1:8080/ on any device to play!
- You can also press `ctrl+c` in console to stop the http server as desired

### And that's all you need to do!

Now you can locally host your own game and view it on any of your devices.

_**Note:** See below for a guide on how to configure Webstorm to automatically update & reload the window live, upon code changes._



Setting up Live Code Debugging & File Watchers
---

If you would like to see your code changes update in real time, as well as automatic compilation of SCSS files, [Webstorm](https://www.jetbrains.com/webstorm/download/#section=windows) has these features built-in!
_If using another IDE, you'll need to find a different, relevant guide for your IDE in order to accomplish all of this._

Here's how you can configure **Webstorm** in order to enable its "Live Edit" & "File Watcher" features for a better development experience:

**Step 1:**

- Navigate to `File > Settings`, then go to `Build, Execution, Deployment > Debugger > Live Edit`

- Enable "Update application in Chrome on changes in..." _(Note: this setting also appears to work for non-chrome browsers as well)_

- Also enable the "Track changes in files compiled to JavaScript, HTML, or CSS" option, since we'll be outputting our compiled `/scss/*.scss` files to the `/css/` folder & want to track those changes as well.

**Step 2:**

- To enable automatic SCSS compilation, go to `File > Settings > Tools > File Watchers` and click the + button and click "SCSS" to create a new File Watcher for our `.scss` files.

- Now in the new window that appears, set the "Arguments" value to `scss/$FileName$:$ProjectFileDir$/css/$FileNameWithoutExtension$.css --no-source-map`

- Set "Output paths to refresh" to `$FileParentDir$/$FileNameWithoutExtension$.css` and "Working directory" to `$ProjectFileDir$`

- Press "OK", ensure our new File Watcher is enabled, and press "OK" again!

_**Note:** If you would like the .css output to be minified OR you want to keep the generated `.map` files: alter the "Arguments" field and add `--style=compressed` to enable minification, and delete `--no-source-map` to re-enable source map generation as desired._

_If you decide to create multiple watchers, ensure only one is enabled at a time. You may also want to change the name of each File Watcher to reflect what each one is for._



Device & Browser Support
---

**Device Support:**

There are plans to implement mobile device support eventually, however it is no longer a top priority. The project has been developed with mobile support in mind from the beginning, so future implementation & testing ideally won't be too difficult.

There are also plans to eventually convert the project into an [Electron application](https://www.electronjs.org/) to standardize gameplay experiences & rendering via relying on a single, standardized browser. This mainly reduces issues relating to how different browsers utilize WebGPU, as Firefox is currently only partially supported.

**Browser Support:**

Until the project is unified into an electron app, cross-browser support will not be guaranteed. Project development & testing is done using [Chrome Canary](https://www.google.com/chrome/canary/) as the baseline browser. Some unexpected behaviors may arrise when using a browser other than default Chrome or Canary.

