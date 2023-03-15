import {Alert, Platform} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import constant from '../config/constant';
import DeviceInfo from 'react-native-device-info';
let API_BASE_URL;
let ENV = constant.ENV;
if (ENV === 2) {
  API_BASE_URL = constant.PROD_BASE_URL;
} else if (ENV === 3) {
  API_BASE_URL = constant.PRE_PROD_URL;
} else {
  API_BASE_URL = constant.DEV_BASE_URL;
}
export const apiRequest = async (
  {
    method,
    version,
    url,
    queryParams = {},
    data = null,
    headers = {
      'Cache-Control': 'no-cache',
      // 'Content-Type': ContentType ? ContentType : 'application/json',
    },
    onUploadProgress,
    onDownloadProgress,
    responseType = 'json',
    ContentType,
  },
  option = {},
) => {
  const args = {
    option: option,
  };

  try {
    //auth key for production
    const token = await AsyncStorage.getItem('token');
    if (typeof token == 'string') {
      headers.authorization = 'Bearer ' + token;
    }

    headers.platform = Platform.OS;
    headers.deviceId = DeviceInfo.getDeviceId();
    headers.buildNumber =
      Platform.OS === 'ios'
        ? constant.BUILD_NUMBER.IOS
        : constant.BUILD_NUMBER.ANDROID;
    if (ContentType) {
      headers['Content-Type'] = ContentType;
    }
    console.log(
      'New Request: ',
      method,
      API_BASE_URL + version + url,
      'headers: ',
      headers,
      'data: ',
      data,
      'queryParams: ',
      queryParams,
    );

    const response = await axios.request({
      baseURL: API_BASE_URL + version,
      method,
      url,
      params: queryParams,
      data,
      headers,
      onUploadProgress,
      onDownloadProgress,
      timeout: 60 * 1000, //6000 seconds
    });

    console.log(
      response.data,
      '===============================================================',
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      /*
       * The request was made and the server responded with a
       * status code that falls out of the range of 2xx
       */

      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response);

      if (error.response.status && error.response.status === 504) {
        return Promise.reject({message: 'Server not responding'});
      }
      if (error.response.status && error.response.status === 403) {
        Alert.alert('Token removed');
        AsyncStorage.removeItem('token');
        // Navigate to Login
      }

      const errorMsg = error.response.data.message
        ? error.response.data.message
        : 'Something went wrong';
      console.log('errorMsg', errorMsg);
      return Promise.reject({message: errorMsg, data: error.response.data});
      // return errorMsg;
    } else if (error.request) {
      /*
       * The request was made but no response was received, `error.request`
       * is an instance of XMLHttpRequest in the browser and an instance
       * of http.ClientRequest in Node.js
       */
      console.log(
        'Error in error.request',
        error.request,
        error.request._url.replace(API_BASE_URL, ''),
      );

      return Promise.reject({
        message: 'Something went wrong! Please check your Internet Connection',
      });
    } else {
      // Something happened in setting up the request and triggered an Error
      console.log('Error in else', error.message);
      console.log('Error in else', error);
      console.log('else == error.response 000000000000000000000000');
    }
  }
};
