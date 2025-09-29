// app.js - AgentFlow logic
const AGENT_DATA = [
  { name: 'Core', agents: [
      { label: 'Start', subtitle: 'Entry trigger', icon: '▶', agentType: 'trigger', params: { system_prompt: '', instructions: '' } },
      { label: 'Reporter', subtitle: 'Summarize', icon: '📋', agentType: 'reporter', params: { mode: 'short' } }
    ] },
  { name: 'Programming', agents: [
      { label: 'Python Coder', subtitle: 'Write Python', icon: '🐍', agentType: 'python_coder', params: { runtime: 'python3.11' } },
      { label: 'JS Coder', subtitle: 'Write JS', icon: '🟨', agentType: 'js_coder', params: { runtime: 'node18' } }
    ] },
  { name: 'Data', agents: [
      { label: 'Data Loader', subtitle: 'Load data', icon: '💾', agentType: 'data_loader', params: { source: 's3://bucket/path' } }
    ] }
];

const App = {
  elems: {},
  state: { editor: null, dragged: null, selectedNodeId: null },
  helpers: {
    esc(s=''){ try { return String(s).replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;', "'":"&#x27;"}[m]||m)); } catch(e){ return String(s) } },
    log(level, msg){
      const c = document.getElementById('log-content');
      if(!c) return;
      const el = document.createElement('div');
      el.className = 'log-entry ' + (level || 'info');
      const time = new Date().toLocaleTimeString();
      el.innerHTML = `<span style="opacity:.7;font-size:12px">[${time}]</span> <strong>${this.esc(msg)}</strong>`;
      c.appendChild(el);
      c.scrollTop = c.scrollHeight;
      document.getElementById('log-panel').classList.add('open');
    }
  },

  renderPanel(){
    const list = document.getElementById('panel-list');
    list.innerHTML = '';
    AGENT_DATA.forEach(cat => {
      const catEl = document.createElement('div');
      catEl.style.marginBottom = '10px';
      catEl.innerHTML = `<div style="font-weight:700;margin-bottom:6px">${this.helpers.esc(cat.name)}</div>`;
      cat.agents.forEach(agent => {
        const el = document.createElement('div');
        el.className = 'agent';
        el.draggable = true;
        el.setAttribute('data-agent', encodeURIComponent(JSON.stringify(agent)));
        el.innerHTML = `<div style="display:flex;gap:10px;align-items:center"><div style="width:40px;height:40px;border-radius:6px;display:flex;align-items:center;justify-content:center">${this.helpers.esc(agent.icon)}</div><div class="meta"><div class="label">${this.helpers.esc(agent.label)}</div><div class="sub">${this.helpers.esc(agent.subtitle)}</div></div></div>`;
        el.addEventListener('dragstart', App.handlers.dragStart);
        el.addEventListener('click', ()=>App.handlers.addNodeByClick(agent));
        catEl.appendChild(el);
      });
      list.appendChild(catEl);
    });
  },

  handlers: {
    dragStart(e){
      const el = e.currentTarget;
      const raw = el.getAttribute('data-agent');
      try{
        const parsed = JSON.parse(decodeURIComponent(raw));
        App.state.dragged = parsed;
        e.dataTransfer.setData('text/plain', raw);
        App.helpers.log('info', `dragStart: ${parsed.label}`);
      } catch(err){
        App.state.dragged = null;
        console.error(err);
        App.helpers.log('error', 'Dragging failed: invalid agent data');
      }
    },

    drop(e){
      e.preventDefault();
      try{
        const agent = App.state.dragged || (()=>{ try{ const raw = e.dataTransfer.getData('text/plain'); return JSON.parse(decodeURIComponent(raw)); }catch{return null}})();
        if(!agent){ App.helpers.log('error','No agent data on drop'); return; }
        const editor = App.state.editor;
        const rect = (editor && editor.precanvas && editor.precanvas.getBoundingClientRect && editor.precanvas.getBoundingClientRect()) || document.getElementById('drawflow').getBoundingClientRect();
        const zoom = (editor && editor.zoom) || 1;
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        const meta = { label: agent.label, subtitle: agent.subtitle, params: agent.params || {} };
        const nodeType = agent.agentType || 'generic-node';
        editor.addNode(nodeType, 1, 1, Math.round(x), Math.round(y), 'agent-node', meta, `<div style="padding:8px"><strong>${App.helpers.esc(meta.label)}</strong><div style="font-size:12px;color:#999">${App.helpers.esc(meta.subtitle)}</div></div>`);
        App.helpers.log('info', `Node added: ${meta.label}`);
        const exported = editor.export();
        const nodeMap = exported.drawflow && exported.drawflow.Home && exported.drawflow.Home.data ? exported.drawflow.Home.data : {};
        const ids = Object.keys(nodeMap);
        const last = ids[ids.length-1];
        if(last){
          const idNum = last.replace('node-','');
          App.handlers.openInspectorById(idNum);
        }
      } catch(err){
        console.error(err);
        App.helpers.log('error','Drop error: ' + (err.message || err));
      } finally {
        App.state.dragged = null;
      }
    },

    dragOver(e){ e.preventDefault(); },

    addNodeByClick(agent){
      const editor = App.state.editor;
      const rect = document.getElementById('drawflow').getBoundingClientRect();
      const x = rect.width / 2;
      const y = rect.height / 2;
      const meta = { label: agent.label, subtitle: agent.subtitle, params: agent.params || {} };
      editor.addNode(agent.agentType || 'generic-node', 1, 1, Math.round(x), Math.round(y), 'agent-node', meta, `<div style="padding:8px"><strong>${App.helpers.esc(meta.label)}</strong><div style="font-size:12px;color:#999">${App.helpers.esc(meta.subtitle)}</div></div>`);
      App.helpers.log('info', `Node added by click: ${meta.label}`);
    },

    openInspectorById(nodeId){
      const editor = App.state.editor;
      const full = editor.getNodeFromId(nodeId);
      App.state.selectedNodeId = nodeId;
      document.getElementById('inspector-id').innerText = 'ID: ' + nodeId;
      const meta = full.data || {};
      const content = document.getElementById('inspector-content');
      content.innerHTML = `
        <div style="display:grid;gap:8px">
          <label style="font-size:12px;color:var(--muted)">Label</label>
          <input id="ins-label" value="${App.helpers.esc(meta.label || full.name || '')}" />
          <label style="font-size:12px;color:var(--muted)">Subtitle</label>
          <input id="ins-sub" value="${App.helpers.esc(meta.subtitle || '')}" />
          <label style="font-size:12px;color:var(--muted)">Params (JSON)</label>
          <textarea id="ins-params">${App.helpers.esc(JSON.stringify(meta.params || {}, null, 2))}</textarea>
          <div style="display:flex;gap:8px">
            <button id="ins-save" class="btn primary">Save</button>
            <button id="ins-delete" class="btn danger">Delete</button>
          </div>
        </div>
      `;
      document.getElementById('inspector-modal-overlay').classList.add('open');
      document.getElementById('ins-save').addEventListener('click', ()=>{
        try{
          const newLabel = document.getElementById('ins-label').value;
          const newSub = document.getElementById('ins-sub').value;
          const params = JSON.parse(document.getElementById('ins-params').value || '{}');
          const updated = {...meta, label: newLabel, subtitle: newSub, params};
          App.state.editor.updateNodeDataFromId(nodeId, updated);
          App.state.editor.updateNodeContent(nodeId, `<div style="padding:8px"><strong>${App.helpers.esc(newLabel)}</strong><div style="font-size:12px;color:#999">${App.helpers.esc(newSub)}</div></div>`);
          App.helpers.log('success', `Node ${nodeId} saved`);
          document.getElementById('inspector-modal-overlay').classList.remove('open');
        } catch(err){
          App.helpers.log('error', 'Invalid JSON in params');
        }
      });
      document.getElementById('ins-delete').addEventListener('click', ()=>{
        if(confirm('Delete node?')){
          App.state.editor.removeNodeId('node-' + nodeId);
          App.helpers.log('info', 'Node deleted: ' + nodeId);
          document.getElementById('inspector-modal-overlay').classList.remove('open');
        }
      });
    },

    closeInspector(){ document.getElementById('inspector-modal-overlay').classList.remove('open'); },

    previewJson(){
      try{
        const exp = App.state.editor.export();
        const w = window.open('about:blank');
        w.document.write('<pre style="padding:12px;background:#0b0b0b;color:#e6e6e6">' + App.helpers.esc(JSON.stringify(exp, null, 2)) + '</pre>');
      } catch(e){
        App.helpers.log('error', 'Preview failed: ' + e.message);
      }
    },

    runFlow(){
      try{
        const exp = App.state.editor.export();
        const nodeMap = exp.drawflow && exp.drawflow.Home && exp.drawflow.Home.data ? exp.drawflow.Home.data : {};
        const ids = Object.keys(nodeMap);
        if(ids.length === 0){ App.helpers.log('info','Canvas empty.'); return; }
        App.helpers.log('info', `Run started — ${ids.length} node(s)`);
        ids.forEach((nid, idx) => {
          setTimeout(() => {
            const node = nodeMap[nid];
            const label = (node.data && node.data.label) || node.name || nid;
            App.helpers.log('info', `Executing ${label}`);
            const type = node.name || node.data?.agentType || 'generic';
            if(type.includes('python') || type.includes('coder')){
              const out = `// generated code snippet for ${label} (${new Date().toLocaleTimeString()})`;
              App.state.editor.updateNodeDataFromId(nid.replace('node-',''), {...node.data, params:{...node.data.params, lastOutput: out}});
              App.helpers.log('success', `Node ${label} produced output.`);
            } else if(type.includes('loader')){
              App.helpers.log('success', `Node ${label} loaded sample data.`);
            } else {
              App.helpers.log('success', `Node ${label} completed.`);
            }
            if(idx === ids.length - 1) App.helpers.log('info', 'Run finished.');
          }, idx * 450);
        });
      } catch(err){
        App.helpers.log('error', 'RunFlow error: ' + (err.message || err));
      }
    }
  },

  init(){
    this.elems = {
      canvasEl: document.getElementById('drawflow'),
      panelList: document.getElementById('panel-list'),
      panelContent: document.getElementById('panel-content')
    };

    // render panel and bind buttons
    this.renderPanel();

    // init drawflow
    const editor = new Drawflow(this.elems.canvasEl);
    editor.reroute = true;
    editor.start();
    this.state.editor = editor;

    // events
    this.elems.canvasEl.addEventListener('dragover', App.handlers.dragOver);
    this.elems.canvasEl.addEventListener('drop', App.handlers.drop);

    editor.on('nodeSelected', function(id){
      try{
        const nid = String(id).replace('node-','');
        App.handlers.openInspectorById(nid);
      } catch(e){ console.error(e); }
    });

    // toolbar
    document.getElementById('previewJson').addEventListener('click', App.handlers.previewJson);
    document.getElementById('runFlow').addEventListener('click', App.handlers.runFlow);
    document.getElementById('openLog').addEventListener('click', ()=>document.getElementById('log-panel').classList.add('open'));
    document.getElementById('closeLogs').addEventListener('click', ()=>document.getElementById('log-panel').classList.remove('open'));
    document.getElementById('clearLogs').addEventListener('click', ()=>{ document.getElementById('log-content').innerHTML = ''; });

    // panel controls
    document.getElementById('close-panel-btn').addEventListener('click', ()=>document.getElementById('add-node-panel').classList.remove('open'));
    document.getElementById('agent-search-input').addEventListener('input', (e)=>{
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#panel-list .agent').forEach(a=>{
        const label = (a.querySelector('.label') && a.querySelector('.label').textContent) || a.textContent;
        a.style.display = label.toLowerCase().includes(q) ? 'block' : 'none';
      });
    });

    // actions
    document.getElementById('saveLocal').addEventListener('click', ()=>{ localStorage.setItem('agentflow-save', JSON.stringify(this.state.editor.export())); this.helpers.log('info','Saved to localStorage'); });
    document.getElementById('exportJson').addEventListener('click', ()=>{ const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.state.editor.export(), null, 2)); const a=document.createElement('a'); a.href=dataStr; a.download='agentflow.json'; document.body.appendChild(a); a.click(); a.remove(); this.helpers.log('info','Exported JSON'); });
    document.getElementById('importJson').addEventListener('click', ()=>{ const input=document.createElement('input'); input.type='file'; input.accept='.json'; input.onchange=(e)=>{ const f=e.target.files[0]; const reader=new FileReader(); reader.onload=(ev)=>{ try{ this.state.editor.import(JSON.parse(ev.target.result)); this.helpers.log('success','Imported JSON'); }catch(err){ this.helpers.log('error','Import failed'); }}; reader.readAsText(f); }; input.click(); });
    document.getElementById('clearAll').addEventListener('click', ()=>{ if(confirm('Clear canvas?')){ this.state.editor.clear(); this.helpers.log('info','Canvas cleared'); } });

    // autoload saved
    const saved = localStorage.getItem('agentflow-save');
    if(saved){ try{ this.state.editor.import(JSON.parse(saved)); this.helpers.log('info','Autoloaded saved flow'); }catch(e){ console.warn('autoload failed', e); } }

    console.info('AgentFlow initialized');
  }
};

document.addEventListener('DOMContentLoaded', ()=>App.init());
