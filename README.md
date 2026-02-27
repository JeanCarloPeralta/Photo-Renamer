# Renombrador De Fotos

Este es un proyecto web automatizado diseñado para procesar y renombrar miles de fotografías de productos basándose en un diccionario de datos (Excel/CSV).

## El Problema Original
Existía la necesidad de procesar miles de fotografías de productos (por ejemplo `123456_1.jpg`) donde el nombre original estaba basado en el Código UPC y contenía sufijos. Se requería renombrar todas estas fotografías al Código Interno del sistema buscando su equivalente en un archivo de Excel, un proceso que manualmente tomaría horas o días.

## La Solución

Una aplicación web automatizada que consta de dos partes:

### 1. Interfaz Web (Frontend)
- **Diseño Personalizado:** Interfaz moderna (colores rojo y naranja) fácil de usar.
- **Drag & Drop:** Interfaz para arrastrar y soltar el archivo Excel y las fotografías.
- **Interactividad:** Feedback en tiempo real.

### 2. Cerebro de Procesamiento (Backend en Python)
- **Lectura Inteligente:** Lee el Excel para mapear Códigos UPC a Códigos Internos.
- **Limpieza y Traducción:** Analiza el nombre de cada foto, extrae el código base, conserva los sufijos (ej: `_1`) y cambia el nombre base al Código Interno.
- **Entrega Eficiente:** Comprime todas las fotos procesadas en un archivo `.zip` para su descarga con un clic, separando las que no se pudieron procesar.

## Arquitectura y Despliegue en Google Cloud

- **Frontend:** Alojado en **Firebase Hosting** para una entrega rápida y segura.
- **Backend:** Implementado en **Google Cloud Run** usando contenedores **Docker**. Esta arquitectura serverless maneja la carga pesada (como leer miles de imágenes y comprimirlas al vuelo) sin afectar el rendimiento de la computadora del usuario, resolviendo además problemas de compatibilidad de procesadores (Apple Silicon vs Linux).

## Enlace en Vivo
La aplicación está desplegada y funcional en:
[https://photo-renamer-cc4cc.web.app](https://photo-renamer-cc4cc.web.app)
