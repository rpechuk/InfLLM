config=config/working/qwen-4b-inf-llm.yaml

mkdir benchmark/infinite-bench-result

python -m benchmark.pred \
--config_path ${config} \
--output_dir_path benchmark/infinite-bench-result \
--datasets kv_retrieval \
--verbose

python -m benchmark.eval --dir_path benchmark/infinite-bench-result