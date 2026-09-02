interface SubmissionEvidenceCellProps {
  evidenceText: string | null
  evidenceUrl: string | null
}

export const SubmissionEvidenceCell = ({
  evidenceText,
  evidenceUrl,
}: SubmissionEvidenceCellProps) => {
  return (
    <td className="max-w-xl align-top text-sm">
      {evidenceText ? <p className="whitespace-pre-wrap break-words">{evidenceText}</p> : null}
      {evidenceUrl ? (
        <a
          href={evidenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="link link-primary block truncate pt-1"
        >
          Enlace
        </a>
      ) : null}
      {!evidenceText && !evidenceUrl ? <span className="text-base-content/50">—</span> : null}
    </td>
  )
}
