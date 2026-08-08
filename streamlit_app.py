import streamlit as st
import streamlit.components.v1 as components
import os
import glob

# Streamlit Page Configuration
st.set_page_config(
    page_title="Navarachna — Autonomous Technology Intelligence Platform",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Hide Streamlit default padding and headers for full-screen web app experience
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    div.block-container {
        padding-top: 0rem !important;
        padding-bottom: 0rem !important;
        padding-left: 0rem !important;
        padding-right: 0rem !important;
        max-width: 100% !important;
    }
    iframe {
        border: none !important;
        width: 100% !important;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def load_standalone_html():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    static_dir = os.path.join(base_dir, "app", "static")
    
    html_path = os.path.join(static_dir, "index.html")
    if not os.path.exists(html_path):
        return "<h2 style='color:red; text-align:center; padding-top: 50px;'>Build artifact index.html not found in app/static/</h2>"
        
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Locate compiled assets
    js_files = glob.glob(os.path.join(static_dir, "assets", "*.js"))
    css_files = glob.glob(os.path.join(static_dir, "assets", "*.css"))

    css_code = ""
    for css_file in css_files:
        with open(css_file, "r", encoding="utf-8") as f:
            css_code += f.read() + "\n"

    js_code = ""
    for js_file in js_files:
        with open(js_file, "r", encoding="utf-8") as f:
            js_code += f.read() + "\n"

    # Safely inject CSS and JS using string replacement to avoid regex escape errors
    if "</head>" in html_content:
        html_content = html_content.replace("</head>", f"<style>\n{css_code}\n</style>\n</head>")
    else:
        html_content = f"<style>\n{css_code}\n</style>\n" + html_content

    if "</body>" in html_content:
        html_content = html_content.replace("</body>", f"<script type=\"module\">\n{js_code}\n</script>\n</body>")
    else:
        html_content = html_content + f"\n<script type=\"module\">\n{js_code}\n</script>"

    return html_content

full_html = load_standalone_html()
components.html(full_html, height=1050, scrolling=True)
