from playwright.sync_api import sync_playwright

def generate_pdf():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        # Navigate to the local HTML file
        page.goto('file:///Users/jeancarlopc/Documents/Fotos AEL/Resumen_del_Proyecto.html')
        # Wait a bit to ensure Google Fonts (Outfit) are fully loaded
        page.wait_for_timeout(3000)
        # Export to PDF with background colors enabled
        page.pdf(
            path='/Users/jeancarlopc/Documents/Fotos AEL/Resumen_del_Proyecto.pdf',
            format='Letter',
            print_background=True,
            margin={'top': '40px', 'bottom': '40px', 'left': '40px', 'right': '40px'}
        )
        browser.close()

if __name__ == '__main__':
    generate_pdf()
