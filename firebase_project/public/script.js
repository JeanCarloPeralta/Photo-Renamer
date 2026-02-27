document.addEventListener('DOMContentLoaded', () => {
    const dictInput = document.getElementById('dict-input');
    const photoInput = document.getElementById('photo-input');
    const submitBtn = document.getElementById('submit-btn');
    const uploadForm = document.getElementById('upload-form');
    const errorMsg = document.getElementById('error-msg');

    // Setup drag and drop UI logic
    function setupDropzone(inputId, dropzoneId, statusId, isMultiple) {
        const input = document.getElementById(inputId);
        const dropzone = document.getElementById(dropzoneId);
        const status = document.getElementById(statusId);

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
        });

        input.addEventListener('change', function() {
            updateStatus(this.files);
        });

        dropzone.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            input.files = files; // Assign files to input
            updateStatus(files);
            checkReadyState();
        });

        function updateStatus(files) {
            if (files.length > 0) {
                dropzone.classList.add('has-file');
                if (isMultiple) {
                    status.textContent = `${files.length} archivo(s) seleccionado(s)`;
                } else {
                    status.textContent = files[0].name;
                }
            } else {
                dropzone.classList.remove('has-file');
                status.textContent = isMultiple ? '0 archivos seleccionados' : 'Ningún archivo seleccionado';
            }
            checkReadyState();
        }
    }

    function checkReadyState() {
        if (dictInput.files.length > 0 && photoInput.files.length > 0) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    }

    setupDropzone('dict-input', 'dict-dropzone', 'dict-status', false);
    setupDropzone('photo-input', 'photo-dropzone', 'photo-status', true);

    dictInput.addEventListener('change', checkReadyState);
    photoInput.addEventListener('change', checkReadyState);

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (dictInput.files.length === 0 || photoInput.files.length === 0) {
            errorMsg.textContent = "Por favor, suba tanto el diccionario como las fotografías.";
            return;
        }

        errorMsg.textContent = "";
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const dictFile = dictInput.files[0];
        const allPhotos = Array.from(photoInput.files);
        const BATCH_SIZE = 15; // Límite para no exceder los 32MB de Google Cloud Run

        try {
            const masterZip = new JSZip();
            const totalBatches = Math.ceil(allPhotos.length / BATCH_SIZE);

            for (let i = 0; i < allPhotos.length; i += BATCH_SIZE) {
                const batchPhotos = allPhotos.slice(i, i + BATCH_SIZE);
                const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;
                
                submitBtn.querySelector('span').textContent = `Procesando lote ${currentBatchNum} de ${totalBatches}...`;
                
                const formData = new FormData();
                formData.append('dictionary', dictFile);
                for (const photo of batchPhotos) {
                    formData.append('photos', photo);
                }

                const response = await fetch('https://photo-renamer-api-473198203222.us-central1.run.app/api/process-photos', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Ocurrió un error en el servidor (Lote ${currentBatchNum})`);
                }

                const blob = await response.blob();
                const batchZip = await JSZip.loadAsync(blob);
                
                // Merge contents into master zip
                batchZip.forEach((relativePath, zipEntry) => {
                    masterZip.file(zipEntry.name, zipEntry.async("blob"));
                });
            }

            submitBtn.querySelector('span').textContent = `Generando archivo final...`;
            
            // Generar ZIP consolidado
            const finalBlob = await masterZip.generateAsync({type: "blob"});
            
            // Lógica de descarga
            const url = window.URL.createObjectURL(finalBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'processed_photos.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            // Restablecer éxito
            submitBtn.querySelector('span').textContent = 'Procesar Fotografías';
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            errorMsg.style.color = 'var(--success)';
            errorMsg.textContent = "¡Éxito! Sus archivos se están descargando.";
            
            setTimeout(() => {
                errorMsg.textContent = "";
                errorMsg.style.color = 'var(--error)';
            }, 5000);

        } catch (error) {
            console.error('Upload Error:', error);
            errorMsg.style.color = 'var(--error)';
            errorMsg.textContent = error.message || "Error al procesar las fotografías. Por favor, revise su conexión e intente nuevamente.";
            submitBtn.querySelector('span').textContent = 'Procesar Fotografías';
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

});
