import os
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def clean_code(code, language):
    """Remove markdown formatting and extract only the code"""
    # Remove markdown code blocks
    code = re.sub(r'^```[\w]*\n?', '', code, flags=re.MULTILINE)
    code = re.sub(r'\n?```$', '', code, flags=re.MULTILINE)
    code = code.strip()
    return code

async def generate_solution(title, description, language, existing_code=""):
    # Map language names
    lang_map = {
        "C++": "C++",
        "Java": "Java", 
        "Python": "Python",
        "Python3": "Python",
        "C": "C",
        "C#": "C#",
        "JavaScript": "JavaScript",
        "TypeScript": "TypeScript",
        "Go": "Go",
        "Ruby": "Ruby",
        "Swift": "Swift",
        "Kotlin": "Kotlin",
        "Rust": "Rust",
        "Scala": "Scala",
        "PHP": "PHP"
    }
    
    lang = lang_map.get(language, language)
    
    prompt = f"""You are an expert competitive programmer. Complete the following LeetCode problem.

Title: {title}

Description:
{description}

Existing code template:
{existing_code}

IMPORTANT RULES:
1. Return ONLY the complete working code in {lang}
2. DO NOT include any markdown formatting like ```python or ```
3. DO NOT include any explanations or comments
4. Keep the exact class name and method signature from the template
5. The code must be ready to paste directly into LeetCode editor
6. Write optimized, clean code that passes all test cases

Return only the raw code, nothing else."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        code = response.choices[0].message.content
        return clean_code(code, lang)
    except Exception as e:
        return f"ERROR: {str(e)}"