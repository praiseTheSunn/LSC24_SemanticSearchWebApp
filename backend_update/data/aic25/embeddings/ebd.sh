for i in $(seq -w 2 20); do
    scp e37c7d938cbf4872a21d40affd38f9ff@ssh.axisapps.io:/raid/hvtham/hlmquan/AIC25/data/embedding/K${i}.zip .
    unzip K${i}.zip
    rm K${i}.zip
done

for i in $(seq -w 21 30); do
    scp e37c7d938cbf4872a21d40affd38f9ff@ssh.axisapps.io:/raid/hvtham/hlmquan/AIC25/data/embedding/L${i}.zip .
    unzip L${i}.zip
    rm L${i}.zip
done