#!/usr/bin/env python3
"""Gera um HTML único do Techlead Desk, sem dependências de terceiros.

Coloque este script na raiz do projeto e execute: python3 unificar.py
Também aceita: python3 unificar.py --projeto /caminho/Techlead-Desk -o painel.html
O JSON de dados continua separado. Use Chrome/Edge com File System Access API.
Este empacotador suporta os imports nomeados e exports declarados do projeto.
Construções de módulos diferentes são recusadas para evitar uma saída incompleta.
"""
import argparse
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

IMPORT = re.compile(r"^\s*import\s*\{([^}]+)\}\s*from\s*(['\"])([^'\"]+)\2\s*;", re.M)
EXPORT = re.compile(r"\bexport\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)")
NAME = re.compile(r"export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)")
LINK = re.compile(r'<link\b[^>]*>', re.I)
SCRIPT = re.compile(r'<script\b([^>]*)>\s*</script\s*>', re.I)
ATTR = re.compile(r'''([\w-]+)\s*=\s*(["'])(.*?)\2''', re.S)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--projeto', type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument('-o', '--saida', type=Path, default=Path('techlead-desk-unico.html'))
    args = parser.parse_args()
    root = args.projeto.resolve()
    output = args.saida.resolve()
    used = set()

    def local(ref, parent):
        url = urlsplit(ref)
        if url.scheme or url.netloc or url.path.startswith('/'):
            raise ValueError(f'Recurso externo não suportado: {ref}')
        path = (parent / unquote(url.path)).resolve()
        if not path.is_relative_to(root):
            raise ValueError(f'Recurso fora do projeto: {ref}')
        if path == output:
            raise ValueError('A saída não pode substituir um arquivo de origem.')
        used.add(path)
        return path

    entry = local('index.html', root)
    html = entry.read_text(encoding='utf-8-sig')
    modules, visiting = {}, set()
    chunks = []

    def module(path):
        if path in visiting:
            raise ValueError(f'Import circular não suportado: {path.name}')
        if path in modules:
            return modules[path]
        visiting.add(path)
        source = path.read_text(encoding='utf-8-sig')
        exports = NAME.findall(source)
        def replace_import(match):
            dependency = local(match[3], path.parent)
            key = module(dependency)
            bindings = []
            for item in match[1].split(','):
                if not item.strip():
                    continue
                parts = re.split(r'\s+as\s+', item.strip())
                if not all(re.fullmatch(r'[A-Za-z_$][\w$]*', x) for x in parts) or len(parts) > 2:
                    raise ValueError(f'Import não suportado em {path.name}: {item}')
                bindings.append(':'.join(parts))
            return 'const {' + ','.join(bindings) + '} = ' + key + ';'
        source = IMPORT.sub(replace_import, source)
        source = EXPORT.sub('', source)
        if re.search(r'^\s*(?:import|export)\b', source, re.M):
            raise ValueError(f'Sintaxe de módulo não suportada em {path.name}')
        key = f'__td_module_{len(modules)}'
        modules[path] = key
        # Cada módulo mantém seu escopo; imports recebem os exports da dependência.
        chunks.append(f'const {key} = (() => {{\n{source}\nreturn {{{",".join(exports)}}};\n}})();')
        visiting.remove(path)
        return key

    css_count = 0
    def stylesheet(match):
        nonlocal css_count
        attrs = dict((k.lower(), v) for k, _, v in ATTR.findall(match[0]))
        if attrs.get('rel', '').lower() != 'stylesheet':
            if attrs.get('href') and not attrs['href'].startswith(('data:', '#')):
                raise ValueError('Recurso HTML não embutido: ' + attrs['href'])
            return match[0]
        css = local(attrs['href'], root).read_text(encoding='utf-8-sig')
        if re.search(r'@import\b|url\(\s*(?![\"\']?data:)', css, re.I):
            raise ValueError('CSS contém recursos adicionais; incorpore-os antes de unificar.')
        if re.search(r'</style', css, re.I):
            raise ValueError('CSS contém fechamento de style não suportado.')
        media = f' media="{attrs["media"]}"' if 'media' in attrs else ''
        css_count += 1
        return f'<style{media}>\n{css}\n</style>'

    html = LINK.sub(stylesheet, html)
    script_count = 0
    def javascript(match):
        nonlocal script_count
        attrs = dict((k.lower(), v) for k, _, v in ATTR.findall(match[1]))
        if 'src' not in attrs:
            return match[0]
        if attrs.get('type') != 'module' or script_count:
            raise ValueError('Esperado um único script de entrada type="module".')
        module(local(attrs['src'], root))
        script_count += 1
        # Base64 impede que strings contendo </script> interrompam o HTML.
        # Mantém execução diferida e strict mode dos módulos originais.
        import base64
        bundle = '"use strict";\n' + '\n'.join(chunks)
        encoded = base64.b64encode(bundle.encode('utf-8')).decode('ascii')
        return '<script defer src="data:text/javascript;base64,' + encoded + '"></script>'

    html = SCRIPT.sub(javascript, html)
    if script_count != 1 or css_count < 1:
        raise ValueError('Não foram encontrados a entrada JS e o CSS esperados.')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding='utf-8')
    print(f'Gerado: {output} ({output.stat().st_size:,} bytes)')
    print(f'Incorporados: {len(modules)} módulos JavaScript e {css_count} CSS.')
    print('Abra o HTML no Chrome/Edge. O JSON de dados continua separado.')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError) as error:
        print(f'Erro: {error}', file=sys.stderr)
        sys.exit(1)
