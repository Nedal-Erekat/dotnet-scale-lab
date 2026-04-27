interface Props {
  servedBy: string
}

export default function ReplicaBadge({ servedBy }: Props) {
  return (
    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
      Replica: {servedBy}
    </span>
  )
}
