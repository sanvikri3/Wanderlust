if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
// console.log(process.env.SECRET);

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');

const listingsRouter = require('./routes/listing.js');
const reviewsRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');

// const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log('connected to DB');
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, '/public')));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: 'mysupersecretstr',
  },
  touchAfter: 24 * 3600,
});

store.on('error', (err) => {
  console.log('Error on mongo store', err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

// app.get('/', (req, res) => {
//   res.send('hello from root');
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// const validateListing = (req, res, next) => {
//   // console.log("validating listing");
//   // console.log(req.body);
//   let {error} = listingSchema.validate(req.body);
//   // console.log(error, "error1");
//   if(error){
//     let errmsg = error.details.map((el) => el.message).join(",");
//     throw new ExpressError(400, errmsg);
//   }
//   else{
//     next();
//   }
// }

// const validateReview=(req,res,next)=>{
//   let {error} = reviewSchema.validate(req.body);
//   if(error){
//     let errmsg = error.details.map((el) => el.message).join(",");
//     throw new ExpressError(400, errmsg);
//   }
//   else{
//     next();
//   }
// }

// //Index Route
// app.get("/listings", async (req, res) => {
//   const allListings = await Listing.find({});
//   res.render("listings/index.ejs", { allListings });
// });

// //New Route
// app.get("/listings/new", (req, res) => {
//   res.render("listings/new.ejs");
// });

// //Show Route
// app.get("/listings/:id", wrapAsync(async (req, res) => {
//   let { id } = req.params;
//   const listing = await Listing.findById(id).populate("reviews");
//   res.render("listings/show.ejs", { listing });
// }));

// //Create Route
// app.post("/listings",validateListing, wrapAsync(async (req, res ,next) => {
//   //  if(!req.body.listing){
//   //    throw new ExpressError(400, "send valid listing data");
// // }
//  let result=listingSchema.validate(req.body);
//  console.log(result);
//  if(result.error){
//   throw new ExpressError(400, error);
//  }
//     const newListing = new Listing(req.body.listing);
//   await newListing.save();
//   // console.log(newListing);
//   res.redirect("/listings");
//   }

// ));

// //Edit Route
// app.get("/listings/:id/edit", wrapAsync( async (req, res) => {
//   let { id } = req.params;
//   const listing = await Listing.findById(id);
//   res.render("listings/edit.ejs", { listing });
// }));

// //Update Route
// app.put("/listings/:id",validateListing, wrapAsync(async (req, res) => {
//   let { id } = req.params;
//   await Listing.findByIdAndUpdate(id, { ...req.body.listing });
//   res.redirect(`/listings/${id}`);
// }));

// //Delete Route
// app.delete("/listings/:id",wrapAsync( async (req, res) => {
//   let { id } = req.params;
//   let deletedListing = await Listing.findByIdAndDelete(id);
//   console.log(deletedListing);
//   res.redirect("/listings");
// }));

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentUser = req.user;
  // res.locals.currentUser = req.user ||null;

  next();
});

// app.get("/demouser",async(req,res)=>{
//   let fakeUser = new User({
//     email:"student@gmail.com",
//     username:"delta-student"
//   });
//        let registeredUser = await User.register(fakeUser,"delta-student");
//        res.send(registeredUser);

//    } );

app.use('/listings', listingsRouter);
app.use('/listings/:id/reviews', reviewsRouter);
app.use('/', userRouter);

//reviews
// //post route
// app.post("/listings/:id/reviews", validateReview , wrapAsync(async (req, res) => {
// let listing= await Listing.findById(req.params.id);
// // console.log(listing);
// // console.log(req.body);
// let newReview = new Review(req.body.review);
// // console.log(newReview)
// listing.reviews.push(newReview);
// await newReview.save();
// await listing.save();

// // console.log("new review added");
// // res.send("new review added");

// res.redirect(`/listings/${listing._id}`);

// }));

// //delete route
// app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
//   let {id, reviewId} = req.params;
//   await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
//   await Review.findByIdAndDelete(reviewId);
//   res.redirect(`/listings/${id}`);
// }));
// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My New Villa",
//     description: "By the beach",
//     price: 1200,
//     location: "Calangute, Goa",
//     country: "India",
//   });

//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful testing");
// });

app.all('*', (req, res, next) => {
  next(new ExpressError(404, 'Page Not Found'));
});

// app.use((err, req, res, next) => {
//   res.send("Something went wrong");
// });

app.use((err, req, res, next) => {
  let { statusCode = 500, message = 'something went wrong' } = err;
  res.status(statusCode).render('error.ejs', { message });
  // console.log(err);
  // res.status(statusCode).render("error.ejs",{message});
  //res.status(statusCode).send(message);
});

app.listen(8080, () => {
  console.log('server is listening to port 8080');
});
