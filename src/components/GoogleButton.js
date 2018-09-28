import React, { Component } from "react";
import { Auth } from "aws-amplify";
import LoaderButton from "./LoaderButton";



export default class GoogleButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      script: null
    };
  }

  async componentDidMount() {
    console.log('Creating the google script tag...');
    const script = document.createElement("script");
    script.onload = () => {
      console.log('Loaded script, now loading our api...')
      // Gapi isn't available immediately so we have to wait until it is to use gapi.
      this.setState({ isLoading: false, script: script });
    };
    script.src = "https://apis.google.com/js/client.js";
    document.body.appendChild(script);
  }

  loadClientWhenGapiReady = (script) => {
    if (script.getAttribute('gapi_processed')) {
      if (window.location.hostname === 'localhost') {
        window.gapi.auth2.init({
          client_id: "170633390474-sgnpm14mb49u4kbah17hckmd6dqasrqm.apps.googleusercontent.com",
          scope: "profile"
        }).then(res => {
          const ga = window.gapi.auth2.getAuthInstance();
          ga.signIn().then(googleUser => {
            this.handleResponse(googleUser)
          })
        })
      }
    }
    else {
      console.log('Client wasn\'t ready, trying again in 100ms');
      setTimeout(() => { this.loadClientWhenGapiReady(script) }, 100);
    }
  }



  handleClick = () => {
    this.loadClientWhenGapiReady(this.state.script)
  };

  handleError(error) {
    alert(error);
  }

  async handleResponse(googleUser) {
    const { id_token, expires_at } = googleUser.getAuthResponse();
    const profile = googleUser.getBasicProfile();
    const user = {
      email: profile.getEmail(),
      name: profile.getName()
    };
    this.setState({ isLoading: true });
    try {
      const cognitoResponse = await Auth.federatedSignIn(
        'google',
        { token: id_token, expires_at },
        user,
      )
      this.setState({ isLoading: false });
      this.props.onLogin(cognitoResponse);
    } catch (err) {
      this.setState({ isLoading: false });
      this.handleError(err);
    }
  }

  render() {
    return (
      <LoaderButton
        block
        bsSize="large"
        bsStyle="primary"
        className="FacebookButton"
        text="Login with Google"
        onClick={this.handleClick}
        disabled={this.state.isLoading}
      />
    );
  }
}
