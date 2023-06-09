# BlogyMania
A blogs project where users can post their blogs and view others post as well. 

The home page contains all the blogs that the users have posted.
To view the entire blog, or to compose a new blog, the user needs to register themselves first.

Registration can be done using their email Id or can be done directly using google.
Once registered and logged in, users can post their blogs and in their my-account page("ME"), they can see the blogs that they have posted and can also delete them from their account.
The deletion of a blog will be reflected in the home page as well.

The backend of the project is created using Node.js, express.js and ejs templating. The database is managed using mongoose.
Authentication is done locally using passport.js as well as with Google using the OAuth 2.0 API.
