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
  // Exam cell functions BEGIN
  if (
    functionName == "gc" ||
    functionName == "ac" ||
    functionName == "uc" ||
    functionName == "gmq" ||
    functionName == "iua" ||
    functionName == "gaqp" ||
    functionName == "gqpu" ||
    functionName == "umq" ||
    functionName == ""
  ) {
    return examCellEndPoint;
  } else if (
    functionName == "agd" ||
    functionName == "ggd" ||
    functionName == "ugd" ||
    functionName == "ggm" ||
    functionName == "agm" ||
    functionName == "dgm" ||
    functionName == ""
  ) {
    return groupMgmtEndPoint;
  } else if (
    functionName == "gbl" ||
    functionName == "gss" ||
    functionName == "gs" ||
    functionName == "gt" ||
    functionName == "ss" ||
    // functionName == "pvq" ||
    functionName == "gqftt" ||
    functionName == "iusa" ||
    functionName == "gesr" ||
    functionName == "gsas" ||
    functionName == "grbt" ||
    functionName == "go" ||
    functionName == "gsst" ||
    functionName == "ant" ||
    functionName == "ut" ||
    functionName == "ams" ||
    functionName == "ums" ||
    functionName == "gms" ||
    functionName == "ms" ||
    functionName == "grqfl" ||
    functionName == "gswt" ||
    functionName == "sst" ||
    functionName == "mcqp" ||
    functionName == "amqp" ||
    functionName == "amt" ||
    functionName == "gmt" ||
    functionName == "gaqatg" ||
    functionName == "grbqp" ||
    functionName == "gad" ||
    functionName == "gttbs" ||
    functionName == "gswpr" ||
    functionName == "gqwp" ||
    functionName == "isq" ||
    functionName == "vqp" ||
    functionName == "gstd" ||
    functionName == "ecg" ||
    functionName == "gstbs" ||
    functionName == "gnmt" ||
    functionName == "gnmqput" ||
    functionName == "unmcqqp" ||
    functionName == "mncqp" ||
    functionName == "gaq" ||
    functionName == "vnqp" ||
    functionName == "guit" ||
    functionName == "uuit" ||
    functionName == "guitn" ||
    functionName == "uad" ||
    functionName == "process_blood_test_image" ||
    functionName == "mubu" ||
    functionName == "gup" ||
    functionName == "gst" ||
    functionName == "gast" ||
    functionName == "itad" ||
    functionName == "gaqao" ||
    functionName == "glsd" ||
    functionName == "autr" ||
    functionName == "sqg" ||
    functionName == "psqg" ||
    functionName == "cqss" ||
    functionName == "gsrbl" ||
    functionName == "ggwr" ||
    functionName == "ghg" ||
    functionName == "co" ||
    functionName == "gqbt" ||
    functionName == "gae" ||
    functionName == "gubo" ||
    functionName == "au" ||
    functionName == "eu" ||
    functionName == "uus" ||
    functionName == "biud" ||
    functionName == "dtsd" ||
    functionName == "abe" ||
    functionName == ""
  ) {
    return QuestionUploadEndPoint;
  } else if (functionName == "gbws") {
    return staffEndPoint;
  } else if (
    functionName == "stul" ||
    // not checked
    functionName == ""
  ) {
    return studentEndPoint;
  } else if (
    functionName == "pvq" ||
    // not checked
    functionName == ""
  ) {
    return helpDeskEndPoint;
  } else if (functionName == "cog_login" || functionName == "") {
    return cognitoEndPoint;
  }
  // Admin functions  END
  else return examCellEndPoint;
}
