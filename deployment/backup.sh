#!/bin/bash
# Database Backup Script for The Pet Kitchen
# Run this script via cron for automated backups

# Configuration
DB_USER="your_db_user"
DB_PASSWORD="your_db_password"
DB_NAME="pet_kitchen_db"
BACKUP_DIR="/backups/pet-kitchen"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Remove old backups (older than retention days)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log backup
echo "$(date): Backup created - db_backup_$DATE.sql.gz" >> $BACKUP_DIR/backup.log

# Optional: Upload to cloud storage (S3, etc.)
# aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-bucket/backups/

echo "Backup completed: db_backup_$DATE.sql.gz"

