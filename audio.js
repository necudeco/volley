const threshold = 150; // Umbral para considerar un pico
console.log("ALTURA DE PICO ", threshold);

// Pedir Permiso
let stream = navigator.mediaDevices.getUserMedia({ audio: true }).then(function(mediaStream){ stream = mediaStream });

document.getElementById("startRecord").addEventListener('click', startRecord);
document.getElementById("stopRecord").addEventListener('click', stopRecord);

const divResultados = document.getElementById("resultados");

const audioPlayback = document.getElementById('audioPlayback');
let arrayBuffer = null;
let audioBuffer = null;

let mediaRecorder;
let audioChunks = [];

function redondear(num, decimales){
    const factor = Math.pow(10, decimales);
    return Math.round(num * factor) / factor;
}

function silbato(){
    const audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.play();
}

async function sleep(ms) {
    return new Promise(function(resolve, reject){
        setTimeout(resolve, ms);
    });
}

function processArray2Object(puntos){
    const sampleRate = 22_050;


    let result = [];
    for ( let i = 0; i < puntos.length ; i++ ){
        result.push({ i, 
            value: redondear( Math.abs( puntos[i] ) ,5 ) ,
            tiempo: redondear( i / sampleRate, 5 )
        });
    }

    return result;
}

function ordenar( puntos ){

}


function obtenerMayorValorDer(puntos, from, to, step){
    
    let high = { value: -100 };
    let muestras = 5;

    //puntos.reverse();
    
    for ( let i = puntos.length-1; i >= 0; i -- ){
        
        if ( puntos[i].value > high.value ){
            
            high = puntos[i];

        }
    }

    return high;
}

function obtenerMayorValorIzq(puntos, from, to, step){
    
    let high = { value: -100 };
    let muestras = 5;

    
    for ( let i = 0; i < puntos.length; i ++ ){

        if ( puntos[i].value > high.value ){
            high = puntos[i];

        }
    }

    return high;
}

function suavizarMediaMovil(puntos, ventana=10) {
    let resultado = [];
    for (let i = 0; i < puntos.length; i++) {
        let suma = 0;
        let contador = 0;
        // Calcular la media móvil usando una ventana de tamaño "ventana"
        for (let j = Math.max(0, i - ventana); j <= Math.min(puntos.length - 1, i + ventana); j++) {
            suma += puntos[j];
            contador++;
        }
        resultado.push( puntos[i] );
    }
    console.log("SuavizarMediaMovil", puntos.length);
    return resultado;
}


async function processArray(canalDatos, limit = 0){
    //const canalDatos = audioBuffer.getChannelData(0); // El canal 0 es el primer canal (izquierdo en audio estéreo)

    let withOutZeros = [];
    for ( let i = 0; i < canalDatos.length; i ++ ){
        let value =  Math.abs(canalDatos[i]);
        if ( value == 0 ){
            continue;
        }
        withOutZeros.push(value);
    }

    let result = [];
    for ( let i = 2; i < withOutZeros.length; i ++ ){
        let absValor0 = Math.abs(withOutZeros[i]);
        i++;
        let absValor1 = Math.abs(withOutZeros[i]);
        i++
        let absValor2 = Math.abs(withOutZeros[i]);

        let promedio = ( ( absValor0 +  absValor1 + absValor2 ) / 3 );

        if ( promedio > limit ){
            result.push(  promedio );
        }
        

    }

    console.log("processArray ", canalDatos.length, withOutZeros.length, result.length);
    console.log(result);

    return result;
}

async function obtenerSonidosFuertes( canalDatos) {
    // Decodificar el ArrayBuffer en un AudioBuffer
    //const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    //const sampleRate = audioBuffer.sampleRate;
    const sampleRate = 22_050;
    console.log("audioBuffer sampleRate", sampleRate);
    console.log("audioBuffer size", audioBuffer.length);

/*
    let canalDatosOrdenado = processArray2Object(canalDatos);
    canalDatosOrdenado.sort( ( a, b ) => a.value - b.value );

    console.log("datos Ordenados");
    console.log(canalDatosOrdenado[0]);
    console.log(canalDatosOrdenado[1]);
    console.log(canalDatosOrdenado[2]);
    console.log(canalDatosOrdenado[3]);


    

    */

    let canalDatosOrdenado = processArray2Object(canalDatos);

    const half = Math.floor( canalDatosOrdenado.length / 2 );


    let izq = obtenerMayorValorIzq( canalDatosOrdenado.slice(0, half) );
    let der = obtenerMayorValorDer( canalDatosOrdenado.slice(half) );

    let diff = der.tiempo - izq.tiempo;
    
    console.log(izq, der );
    console.log("TIEMPO", diff, redondear( diff*1000, 2 ), "ms");
    
    divResultados.innerHTML = `TIEMPO ${diff} ${redondear( diff*1000, 2)} ms`
    return null;

    canalDatos = suavizarMediaMovil(canalDatos, 100);

    mostrarGrafico(canalDatos);

    //processArray(audioBuffer, 0.1);

    // Obtener los datos de uno de los canales (por ejemplo, el canal izquierdo)
    //const canalDatos = audioBuffer.getChannelData(0); // El canal 0 es el primer canal (izquierdo en audio estéreo)

    let picos = [];
    let umbral = 0.7; // Define un umbral de amplitud (valores entre 0 y 1)

    let umbralSuperior = 0.7;
    let umbralInferior = 0.1;

    let high = 0;
    let inicioPico = -100;
    let insidePico = false;
    
    const distanciaMin = 30;

    // Recorrer los datos de audio y encontrar los picos que superan el umbral
    for (let i = 0; i < canalDatos.length; i++) {
        //console.log(i, canalDatos[i]);
        let absValor = redondear( Math.abs(canalDatos[i]) , 6 ); 
        let pico = { valor: absValor, i,  tiempo: redondear( i / sampleRate, 5 ) };

        if ( absValor > umbralSuperior) {
            
            if ( absValor > inicioPico ){
                if ( insidePico == false ){
                    console.log(">>", pico, inicioPico );
                    picos.push(pico);
                }
                insidePico = true;
                inicioPico = absValor;
            }else{

                
            }
            
            //picos.push(pico);
            if ( absValor > high ){
                high = absValor;
            }
            // Un pico acaba cuando el valor inicial del pico va de regreso. Empezo en 150, 152, 153, 154, 155, 153, 152, 150, 149 ( ACA ACABO)
            //i += distanciaMin;
        }

        if ( insidePico &&  ( absValor < umbralInferior) ){
                // Salimos del PICO
                console.log("<<",pico, inicioPico);
                inicioPico = -100;
                insidePico = false;
        }
    }
    console.log("HIGH VALOR", high);
    // Los "picos" ahora contienen los valores más fuertes y el tiempo en el que ocurrieron
    console.log('Picos fuertes encontrados:', picos);
    
    return picos;
}


async function startRecord(){
      // Pedir permiso y capturar el audio del micrófono
      //const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Crear un objeto MediaRecorder
      mediaRecorder = new MediaRecorder(stream);
  
        console.log("Listos para grabar");
        document.getElementById("stopRecord").focus();
        await sleep(1500);

        silbato();

      // Iniciar la grabación
      mediaRecorder.start();
      console.log('Grabación iniciada...');
  
      // Deshabilitar el botón de inicio y habilitar el de detener
      document.getElementById("startRecord").disabled = true;
      document.getElementById("stopRecord").disabled = false;
  
      // Guardar los fragmentos de audio grabados
      mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
      };
  
      // Evento cuando se detiene la grabación
      mediaRecorder.onstop = async () => {
          console.log('Grabación detenida.');
  
          console.log(audioChunks);
          // Crear un Blob con los fragmentos de audio
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          audioChunks = []; // Reiniciar los fragmentos para la próxima grabación
  
          /*
          // Crear una URL temporal para reproducir el audio
          const audioURL = URL.createObjectURL(audioBlob);
          audioPlayback.src = audioURL;*/
  
          // Obtener el buffer de sonido (ArrayBuffer)
          arrayBuffer = await audioBlob.arrayBuffer();
          console.log('Buffer de sonido:', arrayBuffer);
  
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          //    const arrayBuffer = await fetch('ruta/al/archivo.mp3').then(res => res.arrayBuffer());
              audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
              const canalDatos = audioBuffer.getChannelData(0); 

        mostrarGrafico(canalDatos);
          // Aquí puedes hacer algo con el buffer de sonido, como analizarlo o enviarlo a un servidor
      };
}

async function stopRecord(){
    // Detener la grabación
    mediaRecorder.stop();
    console.log('Grabación detenida.');

    // Habilitar el botón de inicio y deshabilitar el de detener
    document.getElementById("startRecord").disabled = false;
    document.getElementById("stopRecord").disabled = true;
};

document.getElementById('startButton').addEventListener('click', async () => {

    console.log("Analizando", arrayBuffer);
    

    
    //const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//    const arrayBuffer = await fetch('ruta/al/archivo.mp3').then(res => res.arrayBuffer());
    //const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const canalDatos = audioBuffer.getChannelData(0); 

    mostrarGrafico(canalDatos);
    obtenerSonidosFuertes(canalDatos);

    return ;
    //const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    
    

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            //const bufferLength = analyser.frequencyBinCount; //1024
            const bufferLength = 256;
            console.log("bufferLength", bufferLength);
            //const dataArray = new Uint8Array(bufferLength);
            const dataArray = new Float32Array(bufferLength);

            
            let lastPeakTime = null;
            let currentPeakTime = null;
            let count = 50;

            function detectPicos() {
                count --;
                if ( count < 0 ) return ;
                requestAnimationFrame(detectPicos);

                analyser.getFloatTimeDomainData(dataArray);

                let peakDetected = false;
                let value = 0;

                for (let i = 0; i < bufferLength; i++) {
                    value = dataArray[i];
                    console.log(count, value, new Date());
                    if (value > threshold) {
                        peakDetected = true;
                        break;
                    }
                }

                if (peakDetected) {
                    currentPeakTime = audioContext.currentTime;

                    if (lastPeakTime !== null) {
                        const timeDifference = currentPeakTime - lastPeakTime;
                        console.log(`${count} Diferencia de tiempo entre picos ( ${value}  ): ${timeDifference} segundos`);
                    }

                    lastPeakTime = currentPeakTime;
                }
            }

            detectPicos();
        })
        .catch(err => console.error('Error al acceder al micrófono: ', err));
});
