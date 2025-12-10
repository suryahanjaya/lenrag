# Fix chat-page.tsx by replacing the broken renderFormattedMessage function

$filePath = "c:\Users\ASUS ZENBOOK\Desktop\lenrag\components\dashboard\chat-page.tsx"
$content = Get-Content $filePath -Raw

# Replace the broken function with the correct one
$oldPattern = @'
    // Component to render formatted chat message
    const renderFormattedMessage = \(content: string, sources\?: Array<string \| \{ id: string; name: string; type: string; link\?: string \}>\) => \{
        // Extract sources from content if present
        let extractedSourceNames: string\[\] = \[\]
        let cleanContent = content

        // Look for "Sumber:" pattern and extract source names
        const sourceMatch = content\.match\(/Sumber:\\s\*\(\[\\n\]\+\)/i\)
        if \(sourceMatch\) \{
            // Extract source names \(split by comma, remove \.pdf/\.docx extensions for matching\)
            const sourceText = sourceMatch\[1\]
            extractedSourceNames = sourceText
                \.split\(','\)
                \.map\(s => s\.trim\(\)\)
                \.filter\(s => s\.length > 0\)
            
            // Remove the "Sumber:" line from content
            cleanContent = content\.replace\(/Sumber:\\s\*\[\\n\]\+\\\.\?\\s\*/gi, ''\)\.trim\(\)
        \}

        const paragraphs = cleanContent\.split\('\\n\\n'\)
        const isIncomplete = detectIncompleteResponse\(cleanContent\)
        const suggestions = isIncomplete \? getQuestionSuggestions\(cleanContent\) : \[\]

        return \{
            content: \(
'@

$newCode = @'
    // Extract sources from content
    const extractSourcesFromContent = (content: string): string[] => {
        const sourceMatch = content.match(/Sumber:\s*([^\n]+)/i)
        if (sourceMatch) {
            const sourceText = sourceMatch[1]
            return sourceText
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0)
        }
        return []
    }

    // Component to render formatted chat message
    const renderFormattedMessage = (content: string) => {
        // Remove "Sumber:" line from content
        const cleanContent = content.replace(/Sumber:\s*[^\n]+\.?\s*/gi, '').trim()
        
        const paragraphs = cleanContent.split('\n\n')
        const isIncomplete = detectIncompleteResponse(cleanContent)
        const suggestions = isIncomplete ? getQuestionSuggestions(cleanContent) : []

        return (
'@

Write-Host "This script would fix the file, but needs manual review first"
Write-Host "Backup exists at: c:\Users\ASUS ZENBOOK\Desktop\lenrag\components\dashboard\chat-page.tsx.backup"
