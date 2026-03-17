$c = New-Object System.Net.Sockets.TcpClient('127.0.0.1',3000)
$s = $c.GetStream()
$req = [System.Text.Encoding]::ASCII.GetBytes('GET / HTTP/1.1\r\nHost: localhost:3000\r\nAccept: text/html\r\nConnection: close\r\n\r\n')
$s.Write($req,0,$req.Length)
Start-Sleep -Milliseconds 200
$sr = New-Object System.IO.StreamReader($s)
$resp = $sr.ReadToEnd()
$c.Close()
Write-Output $resp
