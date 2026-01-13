param ()

$stateBucket = "pdfconverterpro-terraform-state"

Write-Host "Starting cleanup of Terraform state bucket: $stateBucket"

# Function to delete all objects (versions or delete markers) with pagination
function Delete-AllObjects {
    param (
        [string]$BucketName,
        [string]$Type  # "Versions" or "DeleteMarkers"
    )

    $NextToken = $null
    do {
        if ($NextToken) {
            $response = aws s3api list-object-versions --bucket $BucketName --starting-token $NextToken --query "$Type[].{Key:Key,VersionId:VersionId}" --output json | ConvertFrom-Json
        } else {
            $response = aws s3api list-object-versions --bucket $BucketName --query "$Type[].{Key:Key,VersionId:VersionId}" --output json | ConvertFrom-Json
        }

        if ($response) {
            foreach ($item in $response) {
                Write-Host "Deleting $Type object: $($item.Key) [$($item.VersionId)]"
                aws s3api delete-object --bucket $BucketName --key $item.Key --version-id $item.VersionId
            }
        }

        # Check for NextToken
        $NextToken = (aws s3api list-object-versions --bucket $BucketName --query "NextToken" --output text)
        if ($NextToken -eq "None") { $NextToken = $null }
    } while ($NextToken)
}

# Delete all versions
Delete-AllObjects -BucketName $stateBucket -Type "Versions"

# Delete all delete markers
Delete-AllObjects -BucketName $stateBucket -Type "DeleteMarkers"

# Delete any remaining non-versioned objects
Write-Host "Deleting remaining non-versioned objects in bucket: $stateBucket"
aws s3 rm "s3://$stateBucket" --recursive --quiet

Write-Host "Terraform state bucket cleanup completed."
