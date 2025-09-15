async function postCall(endPoint, data) {
  var myHeaders = new Headers();
  myHeaders.append("Accept", "application/json");
  myHeaders.append("Content-Type", "application/json");

  const getFunc = JSON.parse(data);
  endPoint = postCallPreProcess(getFunc["function"]);

  try {
    const response = await fetch(baseUrl + endPoint, {
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
    functionName == ""
  ) {
    return QuestionUploadEndPoint;
  } else if (functionName == "gbws") {
    return staffEndPoint;
  }
  // Admin functions  END
  else return examCellEndPoint;
}
