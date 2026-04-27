interface Props {
  servedBy: string
}

const ReplicaBadge = ({ servedBy }: Props) => (
  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
    Replica: {servedBy}
  </span>
)

export default ReplicaBadge
