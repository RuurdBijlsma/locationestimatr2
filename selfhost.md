### How to self host
!!! To self host you will need to create a Google Maps API key, which requires billing to be set up for that project. 
#### Firebase setup
1. Create a Firebase project https://console.firebase.google.com/u/0/.
2. If you disable Analytics, remember to remove the relevant code from `App.vue` related to Analytics.
3. In Firebase go to the Authentication tab and click "Set up sign-in method", enable "Anonymous" and "Email/Password" (no passwordless sign-in).
4. In the Database tab, click "Create database", start in production mode. Set a location and click "Done".
5. In the Storage tab click "Get started", "Next", and "Done".
7. Click the gear top left of the firebase project page, go to project settings > general > add web app. Choose a name, and also set up Firebase hosting. Then click next a few times to return to the settings page. (Don't follow the instructions about firebase tools yet).
7. In your terminal:
3. Install firebase tools `npm i -g firebase-tools`.
4. Login to firebase `firebase login`.
5. Clone this repository (`git clone https://github.com/ruurdbijlsma/locationestimatr2`).
6. Open the cloned repository folder.
7. Change contents of `.firebaserc` to name of your Firebase project.
7. Run `firebase init` in the project directory. 
13. Follow the prompts, choose Firestore, Hosting and Storage. 
14. Choose defaults filenames for `firestore.rules` and `firestore.indexes.json` and don't overwrite. 
15. Type `dist` when prompted for public directory during Hosting setup.
16. `y` configure as single-page app yes
17. Default file name for `storage.rules`
18. This overwrites `storage.rules` for me for some reason, overwrite it yourself with the file data from the repository:
    ```
    service firebase.storage {
      match /b/{bucket}/o {
        match /images/{imageId} {
          allow read: if request.auth != null
          allow write: if false
        }
        match /images/flags/{imageId} {
          allow read: if request.auth != null
          allow write: if false
        }
        match /images/user/{imageId} {
          allow read: if request.auth != null
          allow create: if request.auth != null &&
                            request.resource.size < 5 * 1024 * 1024 &&
                            request.resource.contentType.matches('image/.*');
          allow update: if false
        }
      }
    }
    ```

#### API Setup

21. Go to https://console.developers.google.com/
22. Select your project (was created alongside your Firebase project)
23. Click "+ Enable APIs and Services", and enable "Maps JavaScript API" 
24. Go to Credentials, add restrictions to the Browser key under API Keys, and copy the Key. 
26. Copy file `credentials.template.json` in `src/assets/` in the repository folder, rename the new file to `credentials.json`
25. Paste the copied key key to in the `googleMapsKey` and `streetViewKey` fields. 
26. Make sure billing is set up for the project in Google Developer Console, otherwise Maps will not work. 

28. In Firebase > Project Settings > General > Your Apps (at the bottom) > Firebase SDK snippet click on the Config radio button, and copy that config (without `const firebaseConfig = `) to `src/assets/credentials.json` in the `firebaseConfig` field. Add `"` to every key in the added object.
28. Final result of `credentials.json` should look similar to content in `credentials.template.json` except with proper keys, ids and names.
29. Run `npm install` and `npm run deploy` in the project directory to deploy storage and Firestore rules to Firebase.

#### Adding maps

#### Testing the game

1. Run `npm run serve` to run a development server to test the game.
3. A link will pop up after a while to `http://localhost:8080` visit this page to see if it's working.

this page is not finished, there will not be maps in the database yet after these steps. 