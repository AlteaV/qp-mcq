async function postCall(endPoint, data, url = null) {
  var myHeaders = new Headers();
  myHeaders.append("Accept", "application/json");
  myHeaders.append("Content-Type", "application/json");

  const aTkn = sessionStorage.getItem("access_token");
  if (aTkn) {
    let authToken = "Bearer " + aTkn;
    myHeaders.append("Authorization", authToken);
  }

  const getFunc = JSON.parse(data);
  endPoint = postCallPreProcess(getFunc["function"]);

  let urlBase = "";
  try {
    if (url) {
      urlBase = url;
    } else {
      urlBase = baseUrl + endPoint;
    }
    let method = "POST";
    if (endPoint == cognitoEndPoint) {
      method = "GET";
    }

    let fetchOptions = {
      method: method,
      headers: myHeaders,
    };

    if (method === "POST") {
      fetchOptions.body = data;
    } else if (method === "GET") {
      let params = new URLSearchParams(JSON.parse(data)).toString();
      urlBase += "?" + params;
    }

    const response = await fetch(urlBase, fetchOptions);
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    alert("Some error occurred");
    console.warn(error);
    return console.warn(error);
  }
}

function postCallPreProcess(functionName) {
  if (functionName == "sln" || functionName == "rps") {
    return authEndPoint;
  }

  if (
    functionName == "gsst" ||
    functionName == "gmt" ||
    functionName == "gbl" ||
    functionName == "gadmd" ||
    functionName == "gl" ||
    functionName == "ggd" ||
    functionName == "gus" ||
    functionName == "gcl" ||
    functionName == "eus" ||
    functionName == "aus" ||
    functionName == "dus" ||
    functionName == "baus" ||
    functionName == "uus" ||
    functionName == "agd" ||
    functionName == "ugd" ||
    functionName == "ggm" ||
    functionName == "agm" ||
    functionName == "dgm" ||
    functionName == "pgcm" ||
    functionName == "ucl" ||
    functionName == "acl" ||
    functionName == "dcl" ||
    functionName == "gcm" ||
    functionName == "dcm" ||
    functionName == "pcm" ||
    functionName == "acm" ||
    functionName == "al" ||
    functionName == "ul" ||
    functionName == "gms" ||
    functionName == "ams" ||
    functionName == "ums" ||
    functionName == "gsas" ||
    functionName == "ant" ||
    functionName == "ut" ||
    functionName == "gst" ||
    functionName == "gswt" ||
    functionName == "amt" ||
    functionName == "uuit" ||
    functionName == "guit" ||
    functionName == "gmqput" ||
    functionName == "umcqqp" ||
    functionName == "smq" ||
    functionName == "gss" ||
    functionName == "gs" ||
    functionName == "gt" ||
    functionName == "mcqp" ||
    functionName == "gap" ||
    functionName == "guitn" ||
    functionName == "amqp" ||
    functionName == "vqp" ||
    functionName == "glsd" ||
    functionName == "gaqao" ||
    functionName == "autr" ||
    functionName == "gstbs" ||
    functionName == "gnmt" ||
    functionName == "gnmqput" ||
    functionName == "unmcqqp" ||
    functionName == "mncqp" ||
    functionName == "vnqp" ||
    functionName == "gttbs" ||
    functionName == "qbue" ||
    functionName == "abe" ||
    functionName == ""
  ) {
    return adminEndPoint;
  } else if (
    functionName == "gtp" ||
    functionName == "gesr" ||
    functionName == "gaqatg" ||
    functionName == "grbqp" ||
    functionName == "gad" ||
    functionName == "gsrbl" ||
    functionName == "ggwr" ||
    functionName == "gqwp" ||
    functionName == "ms" ||
    functionName == ""
  ) {
    return reportEndPoint;
  } else if (
    functionName == "co" ||
    functionName == "" ||
    functionName == "" ||
    functionName == ""
  ) {
    return autEndPoint;
  } else if (
    functionName == "go" ||
    functionName == "gup" ||
    functionName == "" ||
    functionName == ""
  ) {
    return deleteLaterEndPoint;
  } else if (
    functionName == "isq" ||
    functionName == "cqss" ||
    functionName == "ecg" ||
    functionName == "gstd" ||
    functionName == "dtsd" ||
    functionName == "ss" ||
    functionName == "sqg" ||
    functionName == "ghg" ||
    // functionName == "sqtm" ||
    functionName == ""
  ) {
    return genEndPoint;
  } else if (
    functionName == "gud" ||
    functionName == "gaq" ||
    functionName == "grqfl" ||
    functionName == "gae" ||
    functionName == "iusa" ||
    functionName == "sst" ||
    functionName == "gqftt" ||
    functionName == "itad" ||
    functionName == "uad" ||
    functionName == "mqaw" ||
    functionName == ""
  ) {
    return userEndPoint;
  } else if (
    functionName == "stul" ||
    // not checked
    functionName == ""
  ) {
    return studentEndPoint;
  } else if (functionName == "cog_login" || functionName == "") {
    return cognitoEndPoint;
  }
}
