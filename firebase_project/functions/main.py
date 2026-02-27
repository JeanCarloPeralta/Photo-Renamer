import os
import io
import pandas as pd
import zipfile
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="Image Renamer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/process-photos")
async def process_photos(
    dictionary: UploadFile = File(...),
    photos: list[UploadFile] = File(...)
):
    try:
        content = await dictionary.read()
        filename_lower = dictionary.filename.lower()
        
        if filename_lower.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content), dtype=str)
        elif filename_lower.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(content), dtype=str)
        else:
            return JSONResponse(status_code=400, content={"error": "El diccionario debe ser un archivo CSV o Excel (.csv, .xls, .xlsx)"})
        
        # First try to use the specific column names, fallback to first two columns
        columns = df.columns.str.strip().str.lower()
        
        # Try to find the UPC column
        upc_col_name = None
        for col in df.columns:
            if col.strip().lower() in ['codigoupc', 'upc', 'codigo upc']:
                upc_col_name = col
                break
                
        # Try to find the Internal Code column
        intern_col_name = None
        for col in df.columns:
            if col.strip().lower() in ['codigoproducto', 'codigo interno', 'codigo']:
                intern_col_name = col
                break
        
        if upc_col_name and intern_col_name:
            upc_col = df[upc_col_name].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
            intern_col = df[intern_col_name].astype(str).str.strip()
        else:
            # Fallback: assume column 0 is UPC, column 1 is internal code OR vice-versa based on if the user swapped them in the file like in the screenshot
            # Since screenshot shows Codigo Interno = Col 0, UPC = Col 1: Let's check the header strings just in case
            if 'codigo' in str(df.columns[0]).lower() and 'upc' in str(df.columns[1]).lower():
                upc_col = df.iloc[:, 1].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
                intern_col = df.iloc[:, 0].astype(str).str.strip()
            else:
                upc_col = df.iloc[:, 0].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
                intern_col = df.iloc[:, 1].astype(str).str.strip()
        
        # Create mapping dictionary
        mapping = dict(zip(upc_col, intern_col))
        
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
            for photo in photos:
                photo_filename = photo.filename
                
                # Check extension (mirroring the user's script check, extended to .png)
                if not photo_filename.lower().endswith((".jpg", ".jpeg", ".png")):
                    continue
                    
                name, ext = os.path.splitext(photo_filename)
                
                # Suffix logic adapted from user code
                if "_" in name:
                    parts = name.split("_", 1)
                    upc_part = parts[0].strip()
                    sufijo_original = "_" + parts[1]
                else:
                    upc_part = name.strip()
                    sufijo_original = ""
                
                photo_content = await photo.read()
                
                if upc_part in mapping and mapping[upc_part] != 'nan' and mapping[upc_part] != '':
                    codigo_interno = mapping[upc_part]
                    # Create new filename by combining internal code, suffix, and lowercased extension
                    new_name = f"{codigo_interno}{sufijo_original}{ext.lower()}"
                    zip_file.writestr(f"Renamed Photos/{new_name}", photo_content)
                else:
                    zip_file.writestr(f"Unchanged Photos/{photo_filename}", photo_content)
        
        zip_buffer.seek(0)
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=processed_photos.zip"}
        )
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Ocurrió un error: {str(e)}"})

