import graphviz

dot = graphviz.Digraph('ER', format='png')
dot.attr(rankdir='TB', dpi='150', bgcolor='white', pad='0.5')
dot.attr('node', shape='plain', fontsize='11', fontname='Helvetica')
dot.attr('edge', fontsize='10', fontname='Helvetica', arrowsize='0.8')

def make_table(name, color, columns):
    rows = []
    rows.append('<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="6">')
    rows.append('<TR><TD COLSPAN="2" BGCOLOR="' + color + '"><FONT COLOR="white"><B>' + name + '</B></FONT></TD></TR>')
    for col, dtype, is_pk in columns:
        b = '<B>' if is_pk else ''
        e = '</B>' if is_pk else ''
        rows.append('<TR><TD ALIGN="LEFT">' + b + col + e + '</TD><TD ALIGN="LEFT">' + dtype + '</TD></TR>')
    rows.append('</TABLE>>')
    label = '\n'.join(rows)
    dot.node(name, label=label)

make_table('user', '#2c3e50', [
    ('id', 'INTEGER PK', True),
    ('discord_id', 'TEXT NOT NULL UNIQUE', False),
    ('torn_id', 'TEXT NOT NULL UNIQUE', False),
    ('torn_name', 'TEXT NOT NULL UNIQUE', False),
    ('api_key_encrypted', 'TEXT NOT NULL', False),
    ('api_key_status', 'DATETIME DEFAULT NOW', False),
    ('last_inventory_sync', 'TEXT NOT NULL', False),
    ('created_at', 'DATETIME DEFAULT NOW', False),
    ('updated_at', 'DATETIME DEFAULT NOW', False),
    ('flag_delete', "TEXT DEFAULT 'N'", False),
])

make_table('item', '#2c3e50', [
    ('id', 'INTEGER PK', True),
    ('torn_itemid', 'INTEGER NOT NULL', False),
    ('item_name', 'TEXT', False),
    ('item_isconsumable', "TEXT DEFAULT 'N'", False),
    ('item_isactive', "TEXT DEFAULT 'N'", False),
    ('created_at', 'DATETIME DEFAULT NOW', False),
    ('updated_at', 'DATETIME DEFAULT NOW', False),
    ('flag_delete', "TEXT DEFAULT 'N'", False),
])

make_table('inventory_snapshot', '#16a085', [
    ('id', 'INTEGER PK', True),
    ('user_id', 'INTEGER NOT NULL FK', False),
    ('item_id', 'INTEGER NOT NULL FK', False),
    ('quantity', 'INTEGER NOT NULL', False),
    ('refresh', 'DATETIME DEFAULT NOW', False),
])

make_table('listing', '#2980b9', [
    ('id', 'INTEGER PK', True),
    ('seller_id', 'INTEGER NOT NULL FK', False),
    ('item_id', 'INTEGER NOT NULL FK', False),
    ('unit_price', 'REAL NOT NULL', False),
    ('unit_quantity', 'REAL NOT NULL', False),
    ('reserved_quantity', 'REAL DEFAULT 0', False),
    ('available_quantity', 'REAL DEFAULT 0', False),
    ('sold_quantity', 'REAL DEFAULT 0', False),
    ('listing_status', "TEXT DEFAULT 'ACTIVE'", False),
    ('created_at', 'DATETIME', False),
    ('updated_at', 'DATETIME', False),
    ('expires_at', 'DATETIME', False),
    ('flag_delete', "TEXT DEFAULT 'N'", False),
])

make_table('[order]', '#8e44ad', [
    ('id', 'INTEGER PK', True),
    ('buyer_id', 'INTEGER NOT NULL FK', False),
    ('item_id', 'INTEGER NOT NULL FK', False),
    ('item_qty', 'REAL NOT NULL', False),
    ('item_price', 'REAL NOT NULL', False),
    ('total_amount', 'REAL NOT NULL', False),
    ('order_status', "TEXT DEFAULT 'pending'", False),
    ('created_at', 'DATETIME', False),
    ('updated_at', 'DATETIME', False),
    ('expires_at', 'DATETIME', False),
    ('flag_delete', "TEXT DEFAULT 'N'", False),
])

make_table('inventory_reservation', '#e67e22', [
    ('id', 'INTEGER PK', True),
    ('seller_id', 'INTEGER NOT NULL FK', False),
    ('item_id', 'INTEGER NOT NULL FK', False),
    ('listing_id', 'INTEGER NOT NULL FK', False),
    ('item_qty', 'REAL NOT NULL', False),
    ('listing_status', "TEXT DEFAULT 'ACTIVE'", False),
    ('created_at', 'DATETIME', False),
    ('updated_at', 'DATETIME', False),
    ('expires_at', 'DATETIME', False),
    ('flag_delete', "TEXT DEFAULT 'N'", False),
])

make_table('TRADE', '#c0392b', [
    ('id', 'INTEGER PK', True),
    ('listing_id', 'INTEGER NOT NULL FK', False),
    ('buyer_id', 'INTEGER NOT NULL FK', False),
    ('seller_id', 'INTEGER NOT NULL', False),
    ('item_id', 'INTEGER NOT NULL FK', False),
    ('quantity', 'INTEGER NOT NULL', False),
    ('unit_price', 'INTEGER NOT NULL', False),
    ('total_price', 'INTEGER NOT NULL', False),
    ('status', "TEXT DEFAULT 'TRADE_CREATED'", False),
    ('created_at', 'DATETIME DEFAULT NOW', False),
    ('completed_at', 'DATETIME', False),
])

make_table('TRADE_EVENT', '#e74c3c', [
    ('id', 'INTEGER PK', True),
    ('trade_id', 'INTEGER NOT NULL FK', False),
    ('event_type', 'TEXT NOT NULL', False),
    ('actor_id', 'TEXT NOT NULL FK', False),
    ('metadata', 'TEXT NOT NULL', False),
    ('created_at', 'DATETIME DEFAULT NOW', False),
])

make_table('order_items', '#9b59b6', [
    ('id', 'INTEGER PK', True),
    ('order_id', 'INTEGER NOT NULL FK', False),
    ('item_id', 'INTEGER NOT NULL FK', False),
    ('quantity', 'INTEGER NOT NULL', False),
    ('price', 'REAL NOT NULL', False),
])

ekw = dict(arrowhead='crow', arrowtail='tee', dir='both', color='#555555', penwidth='1.5')

dot.edge('user', 'inventory_snapshot', label='1:N', **ekw)
dot.edge('item', 'inventory_snapshot', label='1:N', **ekw)
dot.edge('user', 'listing', label='1:N', **ekw)
dot.edge('user', '[order]', label='1:N', **ekw)
dot.edge('item', '[order]', label='1:N', **ekw)
dot.edge('user', 'inventory_reservation', label='1:N', **ekw)
dot.edge('item', 'inventory_reservation', label='1:N', **ekw)
dot.edge('listing', 'inventory_reservation', label='1:N', **ekw)
dot.edge('listing', 'TRADE', label='1:N', **ekw)
dot.edge('user', 'TRADE', label='1:N (buyer)', **ekw)
dot.edge('item', 'TRADE', label='1:N', **ekw)
dot.edge('TRADE', 'TRADE_EVENT', label='1:N', **ekw)
dot.edge('user', 'TRADE_EVENT', label='1:N (actor)', **ekw)
dot.edge('[order]', 'order_items', label='1:N', **ekw)
dot.edge('item', 'order_items', label='1:N', **ekw)

out = dot.render('er_diagram', cleanup=True)
print('Saved:', out)
