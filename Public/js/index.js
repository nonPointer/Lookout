// onload
window.onload = function () {
    function handleSuccess(stream) {
        console.log('Open camera succeeded!');
        console.log(stream);
        mdui.snackbar('Camera access granted!')
    }

    function handleError(e) {
        console.log('Open camera failed!');
        console.log(e);
        mdui.snackbar('Camera access denied!');
    }

    // Media Streams API specification
    // https://developer.mozilla.org/en-US/docs/Web/API/Media_Streams_API/Constraints
    let constraints = {
        video: true
    };

    // trigger camera
    let cameraButton = document.createElement('button');
    cameraButton.onclick = function () {
        navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
    };
    cameraButton.click();

    // based on example code from
    // https://github.com/naptha/tesseract.js/blob/master/docs/examples.md
    Tesseract.recognize(
        'https://tesseract.projectnaptha.com/img/eng_bw.png',
        'eng',
        {
            logger: m => {
                let loadingText = document.querySelector('#loading-text');
                let msg = m.status.toString().slice(0, 1).toUpperCase() + m.status.toString().slice(1);
                console.log(msg);
                loadingText.innerHTML = msg;
            }
        }
    ).then(({data: {text}}) => {
        console.log(text);
    })
}
