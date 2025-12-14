#!/bin/bash

# DORA Docker Deployment Script
# This script helps you deploy DORA using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose is installed"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        print_info "Creating .env file from template..."
        
        cat > .env << EOF
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
EOF
        
        print_info "Please edit .env file with your actual credentials"
        exit 1
    fi
    print_success ".env file found"
}

# Build and start services
start_development() {
    print_info "Starting DORA in development mode..."
    docker-compose down
    docker-compose up --build -d
    print_success "DORA is running in development mode"
    print_info "Frontend: http://localhost:3000"
    print_info "Backend: http://localhost:8000"
    print_info "API Docs: http://localhost:8000/docs"
}

# Build and start production services
start_production() {
    print_info "Starting DORA in production mode..."
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up --build -d
    print_success "DORA is running in production mode"
    print_info "Frontend: http://localhost:3000"
    print_info "Backend: http://localhost:8000"
    print_info "Nginx: http://localhost"
}

# Stop services
stop_services() {
    print_info "Stopping DORA services..."
    docker-compose down
    docker-compose -f docker-compose.prod.yml down
    print_success "All services stopped"
}

# View logs
view_logs() {
    print_info "Viewing logs (Ctrl+C to exit)..."
    docker-compose logs -f
}

# Clean up
cleanup() {
    print_info "Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
    print_success "Cleanup completed"
}

# Backup volumes
backup_volumes() {
    print_info "Backing up volumes..."
    mkdir -p backups
    timestamp=$(date +%Y%m%d_%H%M%S)
    docker run --rm -v dora-chroma-db:/data -v $(pwd)/backups:/backup alpine tar czf /backup/chroma-backup-${timestamp}.tar.gz -C /data .
    print_success "Backup created: backups/chroma-backup-${timestamp}.tar.gz"
}

# Restore volumes
restore_volumes() {
    if [ -z "$1" ]; then
        print_error "Please provide backup file path"
        exit 1
    fi
    
    print_info "Restoring volumes from $1..."
    docker run --rm -v dora-chroma-db:/data -v $(pwd):/backup alpine tar xzf /backup/$1 -C /data
    print_success "Volumes restored"
}

# Main menu
show_menu() {
    echo ""
    echo "╔═══════════════════════════════════════╗"
    echo "║   DORA Docker Deployment Manager     ║"
    echo "╚═══════════════════════════════════════╝"
    echo ""
    echo "1. Start Development Mode"
    echo "2. Start Production Mode"
    echo "3. Stop All Services"
    echo "4. View Logs"
    echo "5. Backup Volumes"
    echo "6. Restore Volumes"
    echo "7. Clean Up"
    echo "8. Exit"
    echo ""
    read -p "Select an option [1-8]: " choice
    
    case $choice in
        1)
            check_docker
            check_docker_compose
            check_env_file
            start_development
            ;;
        2)
            check_docker
            check_docker_compose
            check_env_file
            start_production
            ;;
        3)
            stop_services
            ;;
        4)
            view_logs
            ;;
        5)
            backup_volumes
            ;;
        6)
            read -p "Enter backup file name: " backup_file
            restore_volumes $backup_file
            ;;
        7)
            read -p "Are you sure? This will delete all data! (y/N): " confirm
            if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
                cleanup
            fi
            ;;
        8)
            print_info "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option"
            ;;
    esac
    
    show_menu
}

# Run main menu
show_menu
