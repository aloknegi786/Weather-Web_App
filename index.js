import express from "express";
import axios from "axios";
import bodyparser from "body-parser";
import { create } from "domain";

const baseUrl1 = "http://api.openweathermap.org/data/2.5/forecast?";
const apiId_weather = "1be5816f64651e77ab3c51bed1da4cd3";
const baseUrl2 = "https://geocode.maps.co/search";
const apiId_coordinates = "66ba3a408c919314983439usz4f4321";



const app = express();
const port = 3000;

app.use(bodyparser.urlencoded({ extended: true}));
app.use(express.static("public"));

// get date
const months = [
    "Jan", "Feb", "Mar", "Apr", 
    "May", "June", "July", "Aug", 
    "Sep", "Oct", "Nov", "Dec"
];
function getDate(s){
    let n = s.length-1;
    let index = parseInt(s.substring(n-4,n-2));
    let din = parseInt(s.substring(n-1,n+1));
    let date = months[index-1] + " " + din;
    return date;
}

let dates = [];
function createList(list){
    const dates = [];
    for(let i = 0;i<list.length;i=i+8) {
        dates.push(getDate((list[i].dt_txt).substring(0,10)))
    }
    return dates;
}

const homeAddress = await axios.get("https://ipinfo.io?token=31224e0b6b43e1");
let a = homeAddress.data.loc;
let lat = parseFloat(a.substring(0, 7));
let lon = parseFloat(a.substring(8,16));

let address;
address =  homeAddress.data.city + ", " + homeAddress.data.region;
let result;

try{
    result = await axios.get(baseUrl1, {
        params: {
          lat: lat,
          lon: lon,
          appid: apiId_weather
        }
    });
} catch (error){
        console.log("An unknown error occured while fetching the home location");
}
dates = createList(result.data.list);
console.log(dates);
    
    app.post("/get_weather", async (req,res) => {
        try{
            console.log(req.body);
            const coordinates = await axios.get(baseUrl2,{
                params: {
                    q: req.body.city,
                    appid: apiId_coordinates
                }
            });
            
            const lat = coordinates.data[0].lat;
            const lon = coordinates.data[0].lon;
            console.log("request for coordinates sent");
            
            result = await axios.get(baseUrl1, {
                params: {
                    lat: lat,
                    lon: lon,
                    appid: apiId_weather
                }
            });
            address = coordinates.data[0].display_name;
            res.redirect("/");
            
        } catch (error){
            address = "Enter the address properly with commas and everything!!"
            res.redirect("/");
        }
    });
    
    app.get("/",async (req,res) => {
        res.render("index.ejs" ,{
            temp: Math.floor(result.data.list[0].main.temp)-273,
            weatherType: result.data.list[0].weather[0].description,
            humidity: result.data.list[0].main.humidity,
            windSpeed:  Math.round(result.data.list[0].wind.speed*1.8 *2) /2 ,
            visibility: result.data.list[0].visibility/1000,
            feelsLike:  Math.floor(result.data.list[0].main.feels_like - 273),
            location: address,
            date: dates,
            min_max: Math.floor(result.data.list[0].main.temp_max-273) + "/"+ Math.floor(result.data.list[0].main.temp_min-273),
            pressure: result.data.list[0].main.pressure,
            rain_chances: result.data.list[0].pop*100,
            item: result.data.list
        });
    });

    app.listen(port,() => {
    console.log(`Server is running on port ${port}`);
});