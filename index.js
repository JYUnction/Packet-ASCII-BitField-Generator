const fs = require('fs')

function generateBitfieldDiagram(fields) {
    const inputRows = document.querySelectorAll('.bitfield-row');
    const fields = [];

    inputRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const label = inputs[0].value.trim();
        const length = parseInt(inputs[1].value);
        if ( label && length > 0 ) {
            if ( length * 2 - 1 < label.length ) {
                alert(`Label "${label}" is too long for its bit length (${length} bits).\nMinimum ${Math.ceil((label.length+1)/2)} bits.`);
            }
            fields.push({ label, length });
        }
    });

    const totalBits = fields.reduce((sum, f) => sum + f.length, 0)
    const rows = Math.ceil(totalBits / 32)

    let bitPointer = 0
    let segments = []

    for (const field of fields) {
        let bitsRemaining = field.length
        let label = field.label

        while (bitsRemaining > 0) {
        const rowStart = Math.floor(bitPointer / 32) * 32
        const rowEnd = rowStart + 32

        const bitsAvailable = rowEnd - bitPointer
        const sliceLen = Math.min(bitsAvailable, bitsRemaining)

        segments.push({
            label: label,
            originLabel: field.label,
            start: bitPointer,
            length: sliceLen,
            fullStart: bitPointer - (field.length - bitsRemaining),
            fullEnd: bitPointer - (field.length - bitsRemaining) + field.length
        })
        

        bitPointer += sliceLen
        bitsRemaining -= sliceLen
        label = "" // Only first slice gets the original label
        }
    }

    let output = ""

    // Header rows
    output += " 0"
    for (let i = 1; i < 4; i++) {
        output += "" + (i).toString().padStart(20, " ")
    }
    output += "\n"

    for (let j = 0; j < 32; j++) {
        output += " " + (j % 10).toString()
    }
    output += "\n"

    for (let i = 0; i < rows; i++) {
        output += "".padEnd(64, "+-") + "+\n"

        let rowStart = i * 32
        let rowEnd = rowStart + 32
        let line = ""

        for (let bit = rowStart; bit < rowEnd;) {
        const segment = segments.find(
            s => s.start <= bit && (s.start + s.length) > bit
        )

        if (!segment) {
            const nextSegment = segments.find(s => s.start > bit)
            const nextBreak = nextSegment ? Math.min(nextSegment.start, rowEnd) : rowEnd
            const width = nextBreak - bit
            const fieldWidth = width * 2 - 1
            const empty = " ".repeat(fieldWidth)
            line += "|" + empty
            bit = nextBreak
            continue
        }

        const segStart = Math.max(segment.start, rowStart)
        const segEnd = Math.min(segment.start + segment.length, rowEnd)
        const width = segEnd - segStart
        const fieldWidth = width * 2 - 1

        // Handle continuation label
        let label
        if (segment.start === segment.fullStart) {
            label = segment.label
        } else {
            const baseLabel = segment.originLabel || ""
            const contdLabel = `${baseLabel} (cont'd)`
            label = fieldWidth >= contdLabel.length ? contdLabel : ""
        }

        const paddedLabel = label
            .padStart(Math.floor((fieldWidth + label.length) / 2), " ")
            .padEnd(fieldWidth, " ")

        const isStartOfMultiRow = segment.fullStart < rowStart
        const leftBorder = isStartOfMultiRow ? "~" : "|"

        const isContinued = segment.fullEnd > rowEnd
        const rightBorder = isContinued ? "~" : "|"

        line += leftBorder + paddedLabel
        bit = segEnd
        if (bit === rowEnd) line += rightBorder
        }

        output += line + "\n"
    }

    output += "".padEnd(64, "+-") + "+\n"
    fs.writeFileSync("output.txt", output, 'utf-8')
}

// Example usage
generateBitfieldDiagram([
    { label: "Destination MAC Address", length: 48 },
    { label: "Source MAC Address", length: 48 },
    { label: "Standard EtherType", length: 16 },
    { label: "Version", length: 4 },
    { label: "IHL", length: 4 },
    { label: "DSCP", length: 6 },
    { label: "ECN", length: 2 },
    { label: "Total Length", length: 16 },
    { label: "Identification", length: 16 },
    { label: "Flags", length: 3 },
    { label: "Fragment Offset", length: 13 },
    { label: "TTL", length: 8 },
    { label: "Protocol", length: 8 },
    { label: "Header Checksum", length: 16 },
    { label: "Source IP Address", length: 32 },
    { label: "Destination IP Address", length: 32 }
])
