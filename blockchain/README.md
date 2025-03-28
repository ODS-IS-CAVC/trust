# Blockchain

このプロジェクトでは、[Hyperledger Besu](https://github.com/hyperledger/besu)をブロックチェーンプラットフォームとして使用しています。

## 環境
- EC2
    - OS: Amazon Linux 2023 AMI
    - インスタンスタイプ: t3.large
    - ボリューム: 30GB
    - 台数: 4台
- Docker Compose: 2.32.1
- Git: 2.40.1
- Hyperledger BESU: 24.12.2
- Node.js (v18以上)(疎通用のため環境構築には不要)
- npm (v9以上)(疎通用のため環境構築には不要)

## 設定ファイル調整箇所
- ```qbftConfig.json```
    - "blockperiodseconds": 3　// ブロック生成速度変更
    
- ```docker-compose.yaml```
    - command: // オプション設定
        - "--fast-sync-min-peers=3", // 同期開始必要最低ピア数
        - "--min-gas-price=0", // 最小ガス価格（0に変更してフリーガス化）

## セットアップ

1. Hyperledger Besuのインストールと設定

    詳細な設定手順については、Hyperledger Besuのリポジトリのドキュメントを参照してください。

    ### 初期セットアップ

    ```
    sudo yum update -y
    sudo yum install -y docker git
    ```

    ### Docker導入

    ```
    sudo service docker start
    sudo systemctl enable docker
    sudo usermod -aG docker ec2-user
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    # version返ればOK
    docker-compose --version
    ```

    ### BESUディレクトリ作成
    ```
    # /home/ec2-user/ に作られる
    mkdir -p ~/besu
    ```

    ### 設定ファイル作成
    ### ※※※ 共通の設定のため最初にだけ行う。出力物は他のサーバーでも使う。※※※

    - 出力先作成
        ```
        mkdir -p ~/besu/output
        ```

    - `init/qbftConfig.json`を`~/besu`に配置してgenerate-blockchain-config実行
        ```
        sudo docker run --rm -v ~/besu:/var/besu hyperledger/besu:latest operator generate-blockchain-config --config-file=/var/besu/qbftConfig.json --to=/var/besu/output
        ```
        ※再度走らせる場合は出力先を空にする必要がある

        ※outputの中身は他でもつかうためローカルに落としておくと作業しやすい

    ### 出力物でファイル修正
    - `static-nodes.json`を変更
    - ※公開鍵は`~/besu/output/keys/0x～/key.pub`の中身
    - ※IPは各サーバーのIP情報

    - `init/toEncode.json`を変更
    - ※アドレスは`~/besu/output/keys/0x～`となっているフォルダ名

    - `init/toEncode.json`を`~/besu`に配置
        ```
        sudo docker run --rm -v ~/besu:/var/besu hyperledger/besu:latest rlp encode --from=/var/besu/toEncode.json --type=QBFT_EXTRA_DATA
        ```
        上記で出力された値で`~/besu/output/genesis.json`内の`extraData`を修正

    ### 接続先情報を修正
    各サーバーのIPとP2PやRPCのポートを変更、以下対象
    - `docker-compose.yaml`
    - `static-nodes.json`

2. Hyperledger Besuの起動
    ### 各サーバーにファイル配置
    対象ファイル
    - `genesis.json`
    - `static-nodes.json`
    - `docker-compose.yaml`
    - `~/besu/output/keys/0x～/key.priv`
    - ※`static-nodes.json`で設定した組み合わせのものを置く


    ### 起動
    ```
    cd ~/besu
    sudo docker-compose up -d
    sudo docker logs besu-node
    ```

    ### 疎通確認
    ### RPC
    - 他のEC2とつながっているか確認
        ```
        curl -X POST --data '{"jsonrpc":"2.0","method":"admin_peers","params":[],"id":1}' http://<接続先IP>:<RPCのポート>
        ```

    - ガス価格が0になっているか確認
        ```
        curl -X POST --data '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}' http://<接続先IP>:<RPCのポート>
        ```
    - トランザクション確認
        ```
        curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getTransactionByHash","params":["transactionHash"],"id":1}' http://<接続先IP>:<RPCのポート>
        ```

    ### node.js
    ライブラリ追加
    ```
    npm install
    ```

    エンドポイントやウォレットアドレスなどは環境に合わせて修正
    - トランザクション送信
        ```
        node js/sendTransaction.js
        ```


    ## 停止
    ```
    cd ~/besu
    sudo docker-compose stop
    ```


    ## 削除
    ```
    cd ~/besu
    sudo docker-compose down
    ```

3. サーバーダウンした後の復旧

    IPが変わっていると思うので、`static-nodes.json`のIP部分を変更

4. ブロックチェーンの再構築手順

    `genesis.json` を変更した場合などは再構築が必要
    
    これまでのデータは利用できなくなる

    - ### コンテナとボリュームの削除

        ```
        cd ~/besu
        docker-compose down --volumes
        ```

    - ### 各EC2に変更した `genesis.json` を渡しなおし

    - ### 再起動
        ```
        cd ~/besu
        docker-compose up -d
        ```

        問題なければスマートコントラクトのデプロイなどを行う















