function DataTable({ columns, data, getRowKey }) {
  if (!data || data.length === 0) {
    return <p>Nenhum dado encontrado.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => (
            <tr key={getRowKey ? getRowKey(row) : index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;