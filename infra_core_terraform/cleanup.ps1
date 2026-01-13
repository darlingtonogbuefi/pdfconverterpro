# infra_core_terraform\cleanup.ps1


param (
    [string]$ProjectName,
    [string]$Environment
)

Write-Host "Removing all objects and versions from S3 buckets..."

# S3 Buckets
$stateBucket = "pdfconverterpro-terraform-state"
$filesBucket = "$ProjectName-files-$Environment"
$frontendBucket = "$ProjectName-frontend-$Environment"

# Function to delete all objects and versions in a versioned bucket
function Clear-S3Bucket {
    param([string]$BucketName)

    # Check if bucket exists
    try {
        aws s3 ls "s3://$BucketName" > $null
    } catch {
        Write-Host "Bucket $BucketName does not exist, skipping."
        return
    }

    Write-Host "Cleaning bucket: $BucketName"

    # Delete all object versions (for versioned buckets)
    $versions = aws s3api list-object-versions --bucket $BucketName --query 'Versions[].{Key:Key,VersionId:VersionId}' --output json | ConvertFrom-Json
    if ($versions) {
        foreach ($v in $versions) {
            aws s3api delete-object --bucket $BucketName --key $v.Key --version-id $v.VersionId
        }
    }

    # Delete all delete markers (needed for versioned buckets)
    $markers = aws s3api list-object-versions --bucket $BucketName --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' --output json | ConvertFrom-Json
    if ($markers) {
        foreach ($m in $markers) {
            aws s3api delete-object --bucket $BucketName --key $m.Key --version-id $m.VersionId
        }
    }

    # Delete any remaining objects (non-versioned)
    aws s3 rm "s3://$BucketName" --recursive --quiet
}

# Clean all buckets
Clear-S3Bucket $stateBucket
Clear-S3Bucket $filesBucket
Clear-S3Bucket $frontendBucket

Write-Host "Cleanup completed."
