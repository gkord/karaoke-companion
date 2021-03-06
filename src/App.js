import React, { Component } from "react";
import axios from "axios";
import Header from "./Components/Header";
import SongList from "./Components/SongList";
import Search from "./Components/Search";
import Modal from "./Components/Modal";
import Footer from "./Components/Footer";
import firebase from "./firebase";
import Swal from "sweetalert2";
import "./App.css";

class App extends Component {
  constructor() {
    super();
    this.state = {
      lyrics: "",
      artistName: "",
      artistDisplay: "",
      songTitle: "",
      songDisplay: "",
      returnedLyrics: []
    };
  }

  //create a function where our API call lives
  getLyrics = () => {
    //Make API Call
    axios({
      method: "GET",
      url: `https://api.lyrics.ovh/v1/${this.state.artistName}/${this.state.songTitle}`,
      dataResponse: "json",
      params: {
        format: "json"
      }
    })
      .then(results => {
        this.setState(
          {
            lyrics: results.data.lyrics
          },
          //pass an empty function, call our database and push items as an object
          () => {
            const dbRef = firebase.database().ref();
            dbRef.push({
              lyrics: this.state.lyrics,
              artistDisplay: this.state.artistDisplay,
              songDisplay: this.state.songDisplay
            });
          }
        );
      })
      .catch(error => {
        Swal.fire({
          type: "error",
          title: "Hmm...",
          text:
            "No results. Lyrics either don't exist in our database or you spelled something wrong. Please try again!"
        });
      });
  };

  componentDidMount() {
    const dbRef = firebase.database().ref();
    dbRef.on("value", response => {
      const newState = [];
      const data = response.val();
      for (let key in data) {
        newState.push({
          key: key,
          artistName: data[key].artistName,
          artistDisplay: data[key].artistDisplay,
          songTitle: data[key].songTitle,
          songDisplay: data[key].songDisplay,
          lyrics: data[key].lyrics
        });
      }
      this.setState({
        returnedLyrics: newState
      });
    });
  }

  handleSetName = event => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  //when user types in input box we are changing state
  handleChange = event => {
    this.handleSetName(event);
  };

  //input validation function
  inputValidate = () => {
    if (this.state.artistName.length === 0 || this.state.songTitle.length === 0)
      return true;
  };

  //when user submits the form, we are calling the function that triggers our API call
  handleSubmit = event => {
    event.preventDefault();
    if (this.inputValidate() === true) {
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: "It appears you've submitted an empty field. Try again!"
      });
    } else this.getLyrics();
    this.setState({
      artistDisplay: this.state.artistName,
      songDisplay: this.state.songTitle,
      artistName: "",
      songTitle: ""
    });
  };

  //when user clicks remove button we remove that object from our page and firebase
  removeSong = songId => {
    const dbRef = firebase.database().ref();
    dbRef.child(songId).remove();
  };

  //opens our modal and passes our lyrics into it
  openModalHandler = lyrics => {
    this.setState({
      isShowing: true,
      lyrics
    });
    //make sure that no matter where user opens modal, it starts at the top of the page
    window.scrollTo(0, 0);
  };
  //closes our modal
  closeModalHandler = () => {
    this.setState({
      isShowing: false
    });
  };

  render() {
    return (
      <div className="App">
        <div className="fixedTop">
          <Header openModal={this.openModalHandler} isShowing = {this.state.isShowing}/>
          {/* {this.state.isShowing && <Instructions />} */}
          <Search
            handleChange={this.handleChange}
            artistName={this.state.artistName}
            songTitle={this.state.songTitle}
            handleSubmit={this.handleSubmit}
          />
        </div>
        <div className="cardContainer wrapper">
          <ul>
            {this.state.returnedLyrics.map((songs, i) => {
              return (
                <SongList
                  index={i}
                  openModal={this.openModalHandler}
                  songClick={this.songClick}
                  artistName={songs.artistName}
                  artistDisplay={songs.artistDisplay}
                  songTitle={songs.songTitle}
                  songDisplay={songs.songDisplay}
                  lyrics={songs.lyrics}
                  removeSong={this.removeSong}
                  key={songs.key}
                  songId={songs.key}
                />
              );
            })}
          </ul>
          {this.state.isShowing && (
            <Modal
              close={this.closeModalHandler}
              lyrics={this.state.lyrics}
              artistName={this.state.artistName}
              songTitle={this.state.songTitle}
            />
          )}
        </div>
        <Footer />
      </div>
    );
  }
}

export default App;
