"""
Setup script for the legal agent system
"""

import subprocess
import sys
import os
import shutil
from pathlib import Path


def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 9):
        print("❌ Error: Python 3.9+ required")
        print(f"   Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version.split()[0]}")
    return True


def install_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing Python dependencies...")
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ], check=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False


def setup_env_file():
    """Setup environment file"""
    env_file = Path(".env")
    env_example = Path("env.example")
    
    if not env_file.exists():
        if env_example.exists():
            print("\n🔧 Creating .env file from template...")
            shutil.copy(env_example, env_file)
            print("✅ .env file created")
            print("⚠️  Please edit .env and add your OPENAI_API_KEY")
        else:
            print("❌ env.example file not found")
            return False
    else:
        print("\n✅ .env file already exists")
    
    return True


def check_docker():
    """Check if Docker is available"""
    try:
        result = subprocess.run(["docker", "--version"], 
                              capture_output=True, text=True, check=True)
        print(f"✅ Docker: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Docker not found. Please install Docker to run PostgreSQL with pgvector")
        return False


def check_docker_compose():
    """Check if Docker Compose is available"""
    try:
        result = subprocess.run(["docker-compose", "--version"], 
                              capture_output=True, text=True, check=True)
        print(f"✅ Docker Compose: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Docker Compose not found")
        return False


def start_postgres():
    """Start PostgreSQL with pgvector"""
    print("\n🐳 Starting PostgreSQL with pgvector...")
    try:
        subprocess.run(["docker-compose", "up", "-d"], check=True)
        print("✅ PostgreSQL started successfully")
        print("   Database: legal_db")
        print("   User: postgres")
        print("   Password: postgres")
        print("   Port: 5432")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start PostgreSQL: {e}")
        return False


def run_tests():
    """Run unit tests"""
    print("\n🧪 Running unit tests...")
    try:
        result = subprocess.run([
            sys.executable, "test_agent.py"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ All tests passed")
            return True
        else:
            print("❌ Some tests failed:")
            print(result.stdout)
            print(result.stderr)
            return False
    except Exception as e:
        print(f"❌ Failed to run tests: {e}")
        return False


def main():
    """Main setup function"""
    print("="*60)
    print("Legal ReAct Agent Setup")
    print("="*60)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Setup environment file
    if not setup_env_file():
        sys.exit(1)
    
    # Check Docker
    docker_available = check_docker()
    docker_compose_available = check_docker_compose()
    
    if docker_available and docker_compose_available:
        # Start PostgreSQL
        if not start_postgres():
            print("⚠️  PostgreSQL setup failed, but continuing...")
    else:
        print("⚠️  Docker not available, skipping PostgreSQL setup")
    
    # Run tests
    print("\n" + "="*60)
    print("Running Tests")
    print("="*60)
    
    if not run_tests():
        print("⚠️  Some tests failed, but setup continues...")
    
    print("\n" + "="*60)
    print("Setup Complete!")
    print("="*60)
    print("\nNext steps:")
    print("1. Edit .env and add your OPENAI_API_KEY")
    
    if docker_available and docker_compose_available:
        print("2. PostgreSQL is running with pgvector")
        print("   - Database: legal_db")
        print("   - Connection: postgresql://postgres:postgres@localhost:5432/legal_db")
    else:
        print("2. Start PostgreSQL with pgvector:")
        print("   docker-compose up -d")
    
    print("3. Run the agent:")
    print("   python legal_agent.py")
    print("4. Run tests:")
    print("   python test_agent.py")
    print("\nFor CI/CD integration, see .github/workflows/eval.yml")


if __name__ == "__main__":
    main()
