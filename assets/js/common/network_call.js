async function postCall(endPoint, data, url = null) {
  var myHeaders = new Headers();
  myHeaders.append("Accept", "application/json");
  myHeaders.append("Content-Type", "application/json");

  const getFunc = JSON.parse(data);
  endPoint = postCallPreProcess(getFunc["function"]);

  let urlBase = "";
  try {
    if (url) {
      urlBase = url;
    } else {
      urlBase = baseUrl + endPoint;
    }
    const response = await fetch(urlBase, {
      method: "POST",
      headers: myHeaders,
      body: data,
    });
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
    functionName == "gbl" ||
    functionName == "gss" ||
    functionName == "gs" ||
    functionName == "gt" ||
    functionName == "ss" ||
    functionName == "pvq" ||
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
  }
  // Admin functions  END
  else return examCellEndPoint;
}
