import sys
from loguru import logger
import os

# Create logs directory if it doesn't exist
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

LOG_FILE = os.path.join(LOG_DIR, "pde.log")

# Configure logger
logger.remove()  # Remove default handler

# Console handler
logger.add(
    sys.stdout, 
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{message}</cyan>", 
    level="INFO"
)

# File handler
logger.add(
    LOG_FILE, 
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {message}", 
    level="INFO", 
    rotation="1 MB"
)

def get_logger():
    return logger
