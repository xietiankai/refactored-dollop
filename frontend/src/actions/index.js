import {DATA_LOADED, UPDATE_DATA_NAME} from "../constants/actionTypes";
import axios from "axios";

export function updateDataName(payload) {
  return { type: UPDATE_DATA_NAME, payload };
}

export function getData() {
  return function(dispatch, getState) {
    axios
      .post("/loadData/", {
        dataName: getState().dataName,
        algorithmName: getState().algorithmName
      })
      .then(response => {
        const parsedData = JSON.parse(JSON.stringify(response.data));
        dispatch({type: DATA_LOADED, payload: parsedData})
      })
  };
}
