// Dependencies
require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const logger = require('morgan')
const moment = require('moment')
const exphbs = require('express-handlebars')

// Require axios and cheerio. This makes the scraping possible
const axio = require('axios');
const cheerio = require('cheerio')
// initialize express app
const app = express()
//Set Port to 3000
const PORT = process.env.PORT || 3000;
//require Other packages
const movieScraped = require('./models/scrapes')
const commentPosted = require('./models/comment')
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(logger("dev"));
// Set Handlebars as the default templating engine.
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/imdbFreediveMovies", { useNewUrlParser: true });
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/imdbFreediveMovies"
mongoose.connect(MONGODB_URI);

// Scrape freedive movies from imdb.com and place it into the mongodb db
app.get("/scrape", function(req, res) {
     const url = 'https://www.imdb.com/freedive/?ref_=nv_tp_fdv'
     // Make a request via axios for the news section of `ycombinator`
     axios.get(url).then(function(result) {
          const results = [];
       // Load the html body from axios into cheerio
       let $ = cheerio.load(result.data);

       // For each element with a "title" class
       $('.ribbonize').each(function(i, element) {
              const $element = $(element)
              const $image = $element.find('figure img').attr('src');
              const $title = $element.find('figcaption div a').text();
              const $rating = $element.find('.freedive-titlePoster__hoverRating span').text();
              const $desc = $element.find('.freedive-titlePoster__hoverDescription').text();
              const $year = $element.find('.freedive-titlePoster__hoverYear').text()
              const $duration = $element.find('.freedive-titlePoster__hoverDuration').text()

              results.push({
               title:$title.trim(),
               image :$image.trim(),
               desc:$desc.trim(),
               rating:$rating.trim(),
               year:$year.trim(),
               duration:$duration.trim()
            });

           //     store scraped movies into database
          })
          return results;
     }).then((results) => {
          movieScraped.create(results)
          .then(movies =>{
              res.send('Scrape complete')
          })
          .catch(err =>{
               res.send(err);
          });
     })
    });
   
    //set the root route
    app.get('/', (req, res)=>{
         //find movies
         movieScraped.find({}).then(movies=>{
              //find comments
          commentPosted.find({}).then(comments=>{
           // Display both comments and movies
             res.render('index',{comments, movies, style: 'index'} )
            
         })
          
     })
     })

   app.get('/searchMovie/:title', (req,res)=>{
        title = req.params.title;
        movieScraped.findOne({title:title}, (err,found)=>{
             if(err) {
                  console.log(err),
                  res.send('Can\'t find movie')
             }else{ 
                  console.log(found)
             res.send(found)
             }
        })
   })
 
//Post user comment to database
   app.post('/submit', (req, res)=>{
   
        console.log(req.body)
        commentPosted.create({
           username : req.body.username,
           email : req.body.email,
           comment : req.body.comment,
           date : req.body.userName,
       })
       .then(comments =>{
           res.json(comments)
       })
       .catch(err =>{
            console.log(err.message)
       });

   
     })

   app.get('/submit', (req, res)=>{
     commentPosted.find({}).then(comments=>{
          res.json(comments)         
     })
   })



app.listen(PORT, ()=>{
     console.log(`Server is listen to PORT ${PORT}`);     
})


