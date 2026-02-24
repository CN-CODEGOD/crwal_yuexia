[CmdletBinding()]
param (
    [Parameter(Mandatory)]
    [string]
    $agent_id,
    [Parameter(Mandatory)]
    [string]
    $cookies
)
$i = [int]$AGENT_ID

if (-not $AGENT_ID) { $AGENT_ID = $env:AGENT_ID }

$COOKIES = $cookies
if (-not $COOKIES) { $COOKIES = $env:COOKIES }

if (-not $AGENT_ID -or -not $COOKIES) {
  Write-Error "Missing AGENT_ID/COOKIES (either params or env)"
  exit 1
}

function crawl {
    param($agentId,$cookies)
    Start-Sleep -Seconds 3
    node ./agent_chat.js -agentId $agentId -cookies $cookies
}



function loop_run {
    
    param($agent_id,$cookies)
    
    for ($i; $i -lt 40000; $i++) {
        $rawcontent= crawl $i $cookies
        if ($null -ne $rawcontent) {
            if ($rawcontent[0] -like "*角色名*") {
        write-host  "添加" $rawcontent[0,1] "到列表..."
        $agentContent= "agentId:$($i-1) `n输出:`n$($rawcontent[0])`n$($rawcontent[1])   "
         Add-Content -Value $agentContent -path ./output/agents_list.txt
        
        }
        elseif ($rawcontent -like "*触发风控限制*") {
            write-host "agentId:$i 触发风控限制，等待10分钟后重试..."
            start-sleep -Seconds 600
            $i--
          
               
                
                
                
        }
        else {
            Add-Content $rawcontent -path ./output/crawl_agentId_error.txt
            Write-Error "发生未知错误，已记录到crawl_agentId_error.txt，agentId:$i`n错误内容:$rawcontent"
     
        }
        }
        else {
            
            $i--
            Write-Error "agentId:$i 没有返回内容，可能是网络问题，已重试..."
            $date=get-date

            Add-Content "$date,`nagentId:$i 没有返回内容，可能是网络问题，已重试... " -path ./output/crawl_agentId_error.txt  
        }
    
    
    
    }
    
    
}
try {
    loop_run -agent_id $AGENT_ID -cookies $COOKIES

}
catch {
     Add-Content $Error -path ./output/crawl_agentId_error.txt
}