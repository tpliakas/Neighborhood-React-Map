import React, { Component } from 'react';
import scriptLoader from 'react-async-script-loader';
import escapeRegExp from 'escape-string-regexp';
import sortBy from 'sort-by';
import './App.css';
import { places } from './places.js';
import { mapStyle } from './mapStyle';

let newMarkers = [];
let infoWindow = [];
class App extends Component{
    state = {
        loadSuccess: true,
        query: '',
        map: {},
        places: places,
        placeData: []
    };

    // Update query when user type on search field
    updatequery =(query) => {
        this.setState({query: query})
    };
  
    updateData = (newData) => {
        this.setState({ placeData: newData});
    };
      
    componentWillReceiveProps({isScriptLoadSucceed}){
        // Error handler for script
        if (isScriptLoadSucceed) {
          // Create map
          const map = new window.google.maps.Map(document.getElementById('map'), 
          {
            // Load map at this location
            center: new window.google.maps.LatLng(40.6088882, 22.9697517),
            styles: mapStyle,
            zoom: 10,
        });
          this.setState({map:map});
        }
        else {
          // Error message
          console.log("Google map failed to load!");
          this.setState({loadSuccess: false})
        }
      };

      componentDidUpdate(){
        // Filter the locations depending on the user input 
        const {places, query, map, placeData} = this.state;
        let showingLocations = places
        if (query) {
          const match = new RegExp(escapeRegExp(query),'i')
          showingLocations = places.filter((location)=> match.test(location.name))
        }
        else{
          showingLocations = places;
        }
        newMarkers.forEach( (marker) => { marker.setMap(null) });
        // Clear the markers and the infoWindow arrays
        newMarkers = [];
        infoWindow = [];
        showingLocations.map((marker)=> {

        // place info
        let placeInfo = placeData.filter(info => info !== [] && info.venueId === marker.venueID).map(item => {
            if(placeData.length === 0) {
                return `No information found about this place!`
            } else if(content !== 0) {
                const message = 
                `Address: ${item.address} <br><br>
                Coordinates: lat: ${item.position.lat.toFixed(5)} , lng:${item.position.lng.toFixed(5)}`;

                return message;
            } else {
                return `No information found about this place!`
            }
        })
       
                    
        let content =
        `<div tabIndex="0" class="infowindow">
            <h2>${marker.name}</h2>
            <p>${placeInfo}</p>
        </div>`
          //Add the content to infoWindow
          let addInfoWindow= new window.google.maps.InfoWindow({
            content: content,
          });
          //Extend the map bound
          let bounds = new window.google.maps.LatLngBounds();
          //Create the marker
          let addmarker = new window.google.maps.Marker({
            map: map,
            position: marker,
            animation: window.google.maps.Animation.DROP,
            name : marker.name
          });
          //Add the marker to the list of marker
          newMarkers.push(addmarker);
          infoWindow.push(addInfoWindow);
          addmarker.addListener('click', function() {
              //Close windows before open the another
              infoWindow.forEach(info => { info.close() });
              addInfoWindow.open(map, addmarker);
              //Clear he animaiton before add the new one
              if (addmarker.getAnimation() !== null) {
                addmarker.setAnimation(null);
              } else {
                //Add the aniamtion when the marker is clicked
                addmarker.setAnimation(window.google.maps.Animation.BOUNCE);
                setTimeout(() => {addmarker.setAnimation(null);}, 400)
              }
            })
          //Bounds
          newMarkers.forEach((m)=>
            bounds.extend(m.position))
          map.fitBounds(bounds)
        })
      }
    
      
    componentDidMount(){
        const clientID = `0IJGJRCXIDLDLKHZHEHNGIUH4YQPNICUQSNHSDEEHDYPCFZJ`;
        const clientSecret = `4O1YHTDH0F2ATFMKXKRHPPMGSIYGEOBH5AXKJ1DL0OMQ54IH`;

        const url = `https://api.foursquare.com/v2/venues/explore?ll=40.591209,22.90525&client_id=${clientID}&client_secret=${clientSecret}&v=20180808`

        fetch(url)
            .then(data => {
            if(data.ok) {
                return data.json();
            } else {
                alert('Failed to get data from Foursquare' + new Error(data.statusText))
            }
            })
            .then(data => {
                const newData = data.response.groups[0].items.map(item => {
                    return {
                      position: { lat: item.venue.location.lat, lng: item.venue.location.lng },
                      title: item.venue.name,
                      venueId: item.venue.id,
                      address: item.venue.location.formattedAddress[0] + " " + item.venue.location.formattedAddress[1],
                      state: item.venue.location.state,
                    }
                  })
                return  this.updateData(newData);              
            })
            .catch(err => {
                console.log(err);
            })
        }
    
      //Trigger a specific marker when the list item is clicked
      listItem = (item) => {
        let selected = newMarkers.filter((currentOne)=> currentOne.name === item.name)
        window.google.maps.event.trigger(selected[0], 'click');
    
      }
      // Accessibility
      handleKeyPress(target,item,e) {
        if(item.charCode===13){
         this.listItem(target,e)
       }
     }

    render(){
        const {places, query, loadSuccess} = this.state;

        let showingLocations;
        if (query){
          const match = new RegExp(escapeRegExp(query),'i')
          showingLocations = places.filter((location)=> match.test(location.name))
        }
        else{
          showingLocations=places;
        }
        showingLocations.sort(sortBy('name'))
        return(
            //Show the map if request successful
            loadSuccess ? (
       <div>
           <div id="container">
               <div id="map" role="application" tabIndex="-1"  aria-label="Restaurante Ramnicu Valcea"></div>
            {/* Menu with all locations on map */}
            <div id="menu">
                <div className="search-container">
                    <input 
                    id="search-input" 
                    type='text'
                    placeholder='Search'
                    value={ query }
                    onChange={ (event)=> this.updatequery(event.target.value) }
                    role="search"
                    aria-labelledby="Search For a Location"
                    tabIndex="1"
                    />
                </div>
                <div className="list-menu">
                    <ul 
                    aria-labelledby="list of locations" 
                    tabIndex="1"
                    >
                        {showingLocations.map((getLocation, index)=>
                            <li 
                            id={ getLocation.name }
                            onKeyPress={ this.handleKeyPress.bind(this,getLocation) } 
                            onClick={ this.listItem.bind(this,getLocation) }
                            key={ index } 
                            tabIndex={ index+2 }
                            area-labelledby={`View details for ${ getLocation.name }`} 
                            >
                            { getLocation.name }
                            </li>
                        )}
                    </ul>
                </div>
            </div>
            </div>
        </div> 
        ) : (
            <div>
            <h1>Map is not working right now, try again later.</h1>
            </div>
            )
       )
    }
}

export default scriptLoader(
    ["https://maps.googleapis.com/maps/api/js?key=AIzaSyCqg6m8v5R7s_VajAqjCl4o_NQ0ojtjaVE"]
)(App)
