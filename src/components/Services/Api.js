import { Component } from 'react';
const axios = require('axios').default;
const baseURL = 'http://localhost:3010/backend-nest/chat/token';

class Api extends Component{
   
   getToken(identity){
      return axios.get(`${baseURL}/${identity}`)
      .then((response) => {
         return response;
      });
   }}
   
const API = new Api();

export default API;