# 查询用户表
docker exec -i sass-postgres-1 psql -U postgres -d sass_kb << 'EOF'
SELECT * FROM "user";
EOF
