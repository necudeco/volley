async function mostrarGrafico(canalDatos) {
    
    console.log("mostrarGrafico", canalDatos);
    // Decodificar el ArrayBuffer en un AudioBuffer
//    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Obtener los datos de audio del primer canal
    //const canalDatos = audioBuffer.getChannelData(0);
    
    // Seleccionar el canvas y el contexto para dibujar
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Variables para el dibujo
    const ancho = canvas.width;
    const alto = canvas.height;
    const paso = Math.floor(canalDatos.length / ancho); // Muestras por píxel horizontal
    const mitadAlto = alto / 2;

    // Dibujar la forma de onda
    ctx.beginPath();
    ctx.moveTo(0, mitadAlto);

    for (let x = 0; x < ancho; x++) {
        const inicio = x * paso;
        const valorPromedio = canalDatos.slice(inicio, inicio + paso).reduce((a, b) => a + b, 0) / paso;
        const y = mitadAlto + valorPromedio * mitadAlto;
        ctx.lineTo(x, y);
    }

    ctx.strokeStyle = 'black';
    ctx.stroke();

    //dividir el canvas 
    ctx.moveTo( ancho / 2, 0 );
    ctx.lineTo( ancho / 2, alto );
    ctx.strokeStyle = 'red';
    ctx.stroke();
}


