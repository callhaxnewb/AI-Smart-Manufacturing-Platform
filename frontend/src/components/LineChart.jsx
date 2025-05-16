import { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function LineChart({ title, labels, data }) {
  const chartRef = useRef(null);

  // Determine the unit and color based on the title
  const isPressure = title.includes('Pressure');
  const unit = isPressure ? 'bar' : '°C';
  const borderColor = isPressure ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)';
  const backgroundColor = isPressure ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132, 0.2)';

  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        borderColor,
        backgroundColor,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: `Value (${unit})`,
        },
      },
    },
  };

  // Clean up chart instance on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-96 w-full">
      <div className="relative h-full w-full">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}

export default LineChart;