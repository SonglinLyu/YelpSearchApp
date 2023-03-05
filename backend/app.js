const express = require('express')
const app = express()
const port = parseInt(process.env.PORT) || 8080;
const cors = require('cors')
const axios = require('axios')

const Yelp_business_url = 'https://api.yelp.com/v3/businesses';
const Yelp_business_search_url = 'https://api.yelp.com/v3/businesses/search';
const Yelp_autocomplete_url = 'https://api.yelp.com/v3/autocomplete';
const Yelp_key = 'fMRcM9M9b2PNizuatYDhfmRxheBZcDFVOJZuuWdGXCRHAECr_qSUqs-GTYpUl7oQYNIwyoDrb3NNFpNd30S9Nr2M8xDXjzweVN6nuMH40exzcPP9Drwr4FieHLUsY3Yx'
const Yelp_headers = {
  'Authorization':
    'Bearer fMRcM9M9b2PNizuatYDhfmRxheBZcDFVOJZuuWdGXCRHAECr_qSUqs-GTYpUl7oQYNIwyoDrb3NNFpNd30S9Nr2M8xDXjzweVN6nuMH40exzcPP9Drwr4FieHLUsY3Yx'
}
const Google_key = 'AIzaSyBbBgpDZDs5jH3W4NYNHtfzry9g9xcoVFY'
const Google_geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"

function autoComplete(text){
  var params = '?text=' + text;
  var url = 'https://api.yelp.com/v3/autocomplete' + params
  // const response = await axios.get(url, {Yelp_headers});
  // console.log(response.data);
  // axios.get(url, {Yelp_headers})
  //   .then((resp) => {console.log(resp.data)})
  var response = []
  axios.get(url, {headers: Yelp_headers})
    .then(function (response) {
      var data = response.data
      var categories = data['categories']
      var terms = data['terms']
      // console.log(categories)
      // console.log(terms)
      for(var i=0; i<categories.length; i++){
        response.push(categories[i]['title'])
      }
      for(var i=0; i<terms.length; i++){
        response.push(terms[i]['text'])
      }
    });
}

app.use(express.static('static'));

app.use(cors({
  origin: 'http://localhost:4200'
}));

app.get('/autocomplete', (req, res) => {
  // console.log(req.query['text'])
  var text = req.query['text']
  var params = '?text=' + text;
  var url = Yelp_autocomplete_url + params
  var auto_list = []
  axios.get(url, {headers: Yelp_headers})
    .then(function (response) {
      var data = response.data
      var categories = data['categories']
      var terms = data['terms']
      // console.log(categories)
      // console.log(terms)
      for(var i=0; i<categories.length; i++){
        auto_list.push({'title': categories[i]['title']})
      }
      for(var i=0; i<terms.length; i++){
        auto_list.push({'title':terms[i]['text']})
      }
      res.json([auto_list]);
    }).catch(function (error) {
      // handle error
      console.log(error);
      res.status(404).send("Can't access yelp api")
    });
})

app.get('/geocode', (req, res) => {
  // console.log(req.query['address'])
  var address = req.query['address']
  var params = '?address=' + address + '&key=' + Google_key;
  var url = Google_geocode_url + params
  var location = []
  axios.get(url)
    .then(function (response) {
      var data = response.data
      location = [String(data['results'][0]['geometry']['location']['lat']), String(data['results'][0]['geometry']['location']['lng'])]
      // console.log(data)
      res.json(location);
    }).catch(function (error) {
      // handle error
      console.log(error);
      res.status(404).send("Can't get geocode location")
    });
})

app.get('/business_search', (req, res) => {
  var term = req.query['term']
  var latitude = req.query['latitude']
  var longitude = req.query['longitude']
  var categories = req.query['categories']
  // console.log(Math.round(req.query['radius'] * 1609).toString())
  var radius = String(Math.round(req.query['radius'] * 1609))
  var params = '?term=' + term + "&latitude=" + latitude + "&longitude=" + longitude + "&categories=" + categories + "&radius=" + radius
  var url = Yelp_business_search_url + params
  // var auto_list = []
  axios.get(url, {headers: Yelp_headers})
    .then(function (response) {
      var data = response.data
      if(data['total'] == 0){
        res.status(400).send("No results available")
      } else{
        var businesses = data['businesses']
      // var terms = data['terms']
      // // console.log(categories)
      // // console.log(terms)
      len = Math.min(10, businesses.length)
      var result_list = []
      for(var i=0; i<len; i++){
        var business = {}
        business['id'] = businesses[i].id
        business['name'] = businesses[i].name
        business['image_url'] = businesses[i].image_url 
        business['rating'] = businesses[i].rating
        business['distance'] = Math.round(businesses[i].distance / 1609)
        result_list.push(business)
      }
      res.json(result_list);
      }
    }).catch(function (error) {
      // handle error
      console.log(error);
      res.status(404).send("Can't access yelp api")
    });
})

app.get('/businesses', (req, res) => {
  // console.log(req.query['address'])
  var id = req.query['id']
  var params = '/' + id;
  var url = Yelp_business_url + params
  
  axios.get(url, {headers: Yelp_headers})
    .then(function (response) {
      if(response.status != 200){
        console.log(response.status)
      }
      var data = response.data
      var result = {}
      result['title'] = data['categories'][0]['title']
      result['coordinates'] = data['coordinates']
      result['phone'] = data['phone']
      result['is_open_now'] = ''
      if(data['hours'] != null){
        result['is_open_now'] = data['hours'][0]['is_open_now']
      }
      result['location'] = ''
      var len = data['location']['display_address'].length
      for(var i=0; i<len; i++){
        result['location'] += data['location']['display_address'][i] + ' '
      }
      result['id'] = data['id']
      result['name'] = data['name']
      result['photos'] = data['photos']
      result['price'] = data['price']
      result['url'] = data['url']
      res.json(result);
    }).catch(function (error) {
      // handle error
      console.log(error);
      res.status(404).send("Can't access yelp api")
    });
})

app.get('/reviews', (req, res) => {
  // console.log(req.query['address'])
  var id = req.query['id']
  var params = '/' + id + '/reviews';
  var url = Yelp_business_url + params
  
  axios.get(url, {headers: Yelp_headers})
    .then(function (response) {
      var reviews = response.data['reviews']
      var result = []
      var result_list = []
      var len = Math.min(3, reviews.length)
      for(var i=0; i<len; i++){
        var review = {}
        review['rating'] = reviews[i]['rating']
        review['name'] = reviews[i]['user']['name']
        review['text'] = reviews[i]['text']
        review['time'] = reviews[i]['time_created'].split(" ")[0]
        result_list.push(review)
      }
      res.json(result_list);
    }).catch(function (error) {
      // handle error
      console.log(error);
      res.status(404).send("Can't access yelp api")
    });
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})